-- AlterEnum (must be in its own migration before using USER)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';
