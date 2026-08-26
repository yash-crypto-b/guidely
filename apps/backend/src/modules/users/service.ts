import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import prisma from '../../db';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../common/errors';
import { JwtPayload } from '../../middleware/auth';
import { RegisterInput, LoginInput, UpdateProfileInput, CreateSessionTypeInput, SetAvailabilityInput } from './schemas';
import { Role } from '@prisma/client';

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: config.jwt.issuer,
  });
  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
    issuer: config.jwt.issuer,
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: Role.STUDENT,
    },
  });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokens(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
      sessionTypes: { where: { isActive: true } },
      availability: { where: { isActive: true } },
    },
  });
  if (!user) throw new NotFoundError('User');
  return sanitizeUser(user);
}

export async function getPublicProfile(handle: string) {
  const user = await prisma.user.findFirst({
    where: { displayName: handle },
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
      sessionTypes: { where: { isActive: true } },
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!user) throw new NotFoundError('Creator');
  return sanitizeUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.displayName !== undefined) data.displayName = input.displayName;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.headline !== undefined) data.headline = input.headline;
  if (input.timezone !== undefined) data.timezone = input.timezone;

  if (input.expertiseTags) {
    const tags = await Promise.all(
      input.expertiseTags.map(async (name) => {
        const tag = await prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        return tag;
      })
    );

    await prisma.creatorTag.deleteMany({ where: { creatorId: userId } });
    await prisma.creatorTag.createMany({
      data: tags.map((tag) => ({ creatorId: userId, tagId: tag.id })),
    });
  }

  if (input.socialLinks) {
    await prisma.socialLink.deleteMany({ where: { userId } });
    await prisma.socialLink.createMany({
      data: input.socialLinks.map((link) => ({ userId, ...link })),
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
    },
  });

  return sanitizeUser(user);
}

export async function becomeCreator(userId: string, headline?: string, bio?: string, expertiseTags?: string[]) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  if (expertiseTags && expertiseTags.length > 0) {
    const tags = await Promise.all(
      expertiseTags.map(async (name) => {
        const tag = await prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        return tag;
      })
    );

    await prisma.creatorTag.deleteMany({ where: { creatorId: userId } });
    await prisma.creatorTag.createMany({
      data: tags.map((tag) => ({ creatorId: userId, tagId: tag.id })),
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      role: Role.CREATOR,
      headline: headline || user.headline,
      bio: bio || user.bio,
    },
  });

  return sanitizeUser(updated);
}

export async function createSessionType(userId: string, input: CreateSessionTypeInput) {
  return prisma.sessionTypeDefinition.create({
    data: {
      creatorId: userId,
      ...input,
      price: input.isFree ? 0 : input.price || 0,
    },
  });
}

export async function updateSessionType(userId: string, sessionTypeId: string, input: Partial<CreateSessionTypeInput>) {
  const session = await prisma.sessionTypeDefinition.findFirst({
    where: { id: sessionTypeId, creatorId: userId },
  });
  if (!session) throw new NotFoundError('Session type');

  return prisma.sessionTypeDefinition.update({
    where: { id: sessionTypeId },
    data: input,
  });
}

export async function deleteSessionType(userId: string, sessionTypeId: string) {
  const session = await prisma.sessionTypeDefinition.findFirst({
    where: { id: sessionTypeId, creatorId: userId },
  });
  if (!session) throw new NotFoundError('Session type');

  return prisma.sessionTypeDefinition.update({
    where: { id: sessionTypeId },
    data: { isActive: false },
  });
}

export async function setAvailability(userId: string, input: SetAvailabilityInput) {
  await prisma.availability.deleteMany({ where: { userId } });

  if (input.slots.length > 0) {
    await prisma.availability.createMany({
      data: input.slots.map((slot) => ({
        userId,
        ...slot,
      })),
    });
  }

  return prisma.availability.findMany({ where: { userId, isActive: true } });
}

export async function addBlackoutDate(userId: string, date: Date, reason?: string) {
  return prisma.blackoutDate.create({
    data: { userId, date, reason },
  });
}

export async function searchCreators(query: {
  search?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  page?: number;
  limit?: number;
}) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: any = {
    role: Role.CREATOR,
    isActive: true,
    sessionTypes: { some: { isActive: true } },
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { headline: { contains: query.search, mode: 'insensitive' } },
      { bio: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.tags && query.tags.length > 0) {
    where.creatorTags = {
      some: { tag: { name: { in: query.tags } } },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creatorTags: { include: { tag: true } },
        sessionTypes: { where: { isActive: true } },
        _count: { select: { reviewsReceived: true } },
        reviewsReceived: { select: { rating: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const creators = users.map((u) => {
    const avgRating = u.reviewsReceived.length > 0
      ? u.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / u.reviewsReceived.length
      : null;
    return {
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      photoUrl: u.photoUrl,
      headline: u.headline,
      bio: u.bio,
      expertiseTags: u.creatorTags.map((ct) => ct.tag.name),
      sessionTypes: u.sessionTypes,
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: u._count.reviewsReceived,
    };
  });

  return { creators, total, page, limit };
}

function sanitizeUser(user: any) {
  const { passwordHash, refreshToken, ...safe } = user;
  return safe;
}
