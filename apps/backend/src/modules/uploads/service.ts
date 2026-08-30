import prisma from '../../db';
import { NotFoundError, ValidationError } from '../../common/errors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ─── Upload Profile Photo ─────────────────────────────────────────────

export async function uploadProfilePhoto(
  userId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
) {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError({ file: ['Invalid file type. Allowed: JPEG, PNG, WebP, GIF'] });
  }

  // Validate file size (max 5MB)
  if (file.buffer.length > 5 * 1024 * 1024) {
    throw new ValidationError({ file: ['File too large. Maximum size: 5MB'] });
  }

  // Generate unique filename
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `profile-${userId}-${uuidv4()}${ext}`;

  // In production, upload to S3/Supabase Storage/etc.
  // For now, store as base64 data URL
  const base64 = file.buffer.toString('base64');
  const dataUrl = `data:${file.mimetype};base64,${base64}`;

  // Update user profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: dataUrl },
    select: { id: true, photoUrl: true },
  });

  return { photoUrl: user.photoUrl, filename };
}

// ─── Upload Resume ────────────────────────────────────────────────────

export async function uploadResume(
  userId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
) {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError({ file: ['Invalid file type. Allowed: PDF, DOC, DOCX'] });
  }

  // Validate file size (max 10MB)
  if (file.buffer.length > 10 * 1024 * 1024) {
    throw new ValidationError({ file: ['File too large. Maximum size: 10MB'] });
  }

  // Generate unique filename
  const ext = path.extname(file.originalname) || '.pdf';
  const filename = `resume-${userId}-${uuidv4()}${ext}`;

  // In production, upload to S3/Supabase Storage/etc.
  // For now, store metadata only
  const resumeUrl = `/uploads/resumes/${filename}`;

  // Store resume metadata in user's social links
  await prisma.socialLink.create({
    data: {
      userId,
      platform: 'resume',
      url: resumeUrl,
    },
  });

  return { resumeUrl, filename, size: file.buffer.length };
}

// ─── Get user's uploaded files ────────────────────────────────────────

export async function getUserUploads(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      socialLinks: {
        where: { platform: 'resume' },
      },
    },
  });

  if (!user) throw new NotFoundError('User');

  return {
    profilePhoto: user.photoUrl,
    resumes: user.socialLinks.map((link: any) => ({
      url: link.url,
      uploadedAt: link.createdAt,
    })),
  };
}

// ─── Delete profile photo ─────────────────────────────────────────────

export async function deleteProfilePhoto(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: null },
  });
  return { deleted: true };
}

// ─── Delete resume ────────────────────────────────────────────────────

export async function deleteResume(userId: string, resumeUrl: string) {
  await prisma.socialLink.deleteMany({
    where: {
      userId,
      platform: 'resume',
      url: resumeUrl,
    },
  });
  return { deleted: true };
}
