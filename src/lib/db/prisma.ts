import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseConfig } from "./database-config";

const adapter = new PrismaPg(getDatabaseConfig());

export const prisma = new PrismaClient({ adapter });