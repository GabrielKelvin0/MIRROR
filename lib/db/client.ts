// This file exports the Prisma client.
// Centralize the client so it can be cached and reused.

import "server-only";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use global to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };

declare global {
  var prisma: PrismaClient | undefined;
}
