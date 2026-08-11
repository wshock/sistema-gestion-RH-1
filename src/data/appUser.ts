import { prisma } from "@/data/prisma";

export function findAppUserByEmail(email: string) {
  return prisma.appUser.findUnique({ where: { email } });
}

type AppUserCredentials = {
  email: string;
  passwordHash: string;
  name: string;
};

export function upsertAppUserByEmail({ email, passwordHash, name }: AppUserCredentials) {
  return prisma.appUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}
