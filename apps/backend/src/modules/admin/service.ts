import prisma from '../../db';
import { NotFoundError } from '../../common/errors';
import { config } from '../../config';

export async function getDashboardStats() {
  const [
    totalUsers,
    totalCreators,
    totalStudents,
    totalBookings,
    completedBookings,
    paidBookingsAmount,
    activeCreators,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CREATOR' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'succeeded' } }),
    prisma.user.count({ where: { role: 'CREATOR', isActive: true } }),
  ]);

  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const gmw = paidBookingsAmount._sum.amount || 0;

  return {
    totalUsers,
    totalCreators,
    totalStudents,
    totalBookings,
    completedBookings,
    completionRate: Math.round(completionRate * 100) / 100,
    gmw,
    activeCreators,
  };
}

export async function getUsers(page = 1, limit = 50, role?: string) {
  const where: any = {};
  if (role) where.role = role;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        _count: { select: { creatorBookings: true, studentBookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function toggleUserStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
}

export async function verifyCreator(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  return prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
}

export async function getPlatformConfig() {
  let configRecord = await prisma.platformConfig.findUnique({ where: { id: 'platform' } });
  if (!configRecord) {
    configRecord = await prisma.platformConfig.create({
      data: { id: 'platform' },
    });
  }
  return configRecord;
}

export async function updatePlatformConfig(data: { feePercent?: number; platformName?: string; supportEmail?: string }) {
  return prisma.platformConfig.upsert({
    where: { id: 'platform' },
    create: { id: 'platform', ...data },
    update: data,
  });
}
