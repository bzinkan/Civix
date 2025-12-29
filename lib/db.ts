import { PrismaClient } from "@prisma/client";

export type DatabaseStatus = {
  connected: boolean;
  message: string;
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getDatabaseStatus(): DatabaseStatus {
  return {
    connected: true,
    message: "Prisma client initialized."
  };
}
