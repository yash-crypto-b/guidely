import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@guidely.dev' },
    update: {},
    create: {
      email: 'admin@guidely.dev',
      passwordHash,
      name: 'Admin',
      role: Role.SUPERADMIN,
      isVerified: true,
    },
  });

  const creator = await prisma.user.upsert({
    where: { email: 'creator@guidely.dev' },
    update: {},
    create: {
      email: 'creator@guidely.dev',
      passwordHash,
      name: 'Jane Creator',
      displayName: 'janecreator',
      headline: 'Senior Software Engineer & Career Coach',
      bio: 'I help junior engineers level up their careers through mock interviews and resume reviews.',
      role: Role.CREATOR,
      isVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@guidely.dev' },
    update: {},
    create: {
      email: 'student@guidely.dev',
      passwordHash,
      name: 'John Student',
      role: Role.STUDENT,
    },
  });

  const tags = ['Software Engineering', 'Career Coaching', 'Resume Review', 'Mock Interview', 'System Design', 'Leadership'];
  for (const name of tags) {
    await prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
  }

  const seTag = await prisma.tag.findUnique({ where: { name: 'Software Engineering' } });
  const careerTag = await prisma.tag.findUnique({ where: { name: 'Career Coaching' } });
  if (seTag && careerTag) {
    await prisma.creatorTag.upsert({
      where: { creatorId_tagId: { creatorId: creator.id, tagId: seTag.id } },
      update: {},
      create: { creatorId: creator.id, tagId: seTag.id },
    });
    await prisma.creatorTag.upsert({
      where: { creatorId_tagId: { creatorId: creator.id, tagId: careerTag.id } },
      update: {},
      create: { creatorId: creator.id, tagId: careerTag.id },
    });
  }

  await prisma.sessionTypeDefinition.upsert({
    where: { id: 'mock-interview' },
    update: {},
    create: {
      id: 'mock-interview',
      creatorId: creator.id,
      title: 'Mock Interview (60 min)',
      description: 'Full-length mock technical interview with feedback',
      duration: 60,
      price: 7500,
    },
  });

  await prisma.sessionTypeDefinition.upsert({
    where: { id: 'resume-review' },
    update: {},
    create: {
      id: 'resume-review',
      creatorId: creator.id,
      title: 'Resume Review (30 min)',
      description: 'Get personalized feedback on your resume',
      duration: 30,
      price: 3500,
    },
  });

  await prisma.availability.upsert({
    where: { id: 'avail-mon' },
    update: {},
    create: {
      id: 'avail-mon',
      userId: creator.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  await prisma.availability.upsert({
    where: { id: 'avail-wed' },
    update: {},
    create: {
      id: 'avail-wed',
      userId: creator.id,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  await prisma.availability.upsert({
    where: { id: 'avail-fri' },
    update: {},
    create: {
      id: 'avail-fri',
      userId: creator.id,
      dayOfWeek: 5,
      startTime: '10:00',
      endTime: '15:00',
    },
  });

  await prisma.platformConfig.upsert({
    where: { id: 'platform' },
    update: {},
    create: {
      id: 'platform',
      feePercent: 0,
      platformName: 'Guidely',
    },
  });

  console.log('Seed data created successfully');
  console.log(`Admin: admin@guidely.dev / admin123`);
  console.log(`Creator: creator@guidely.dev / admin123`);
  console.log(`Student: student@guidely.dev / admin123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
