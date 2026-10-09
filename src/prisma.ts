import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from 'bun';
import type {
    PrismaClientInitializationError,
    PrismaClientKnownRequestError,
    PrismaClientUnknownRequestError,
    PrismaClientRustPanicError,
    PrismaClientValidationError
} from '@prisma/client/runtime/client';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export * from '@prisma/client';
export type PrismaClientError =
    | PrismaClientInitializationError
    | PrismaClientKnownRequestError
    | PrismaClientUnknownRequestError
    | PrismaClientRustPanicError
    | PrismaClientValidationError;