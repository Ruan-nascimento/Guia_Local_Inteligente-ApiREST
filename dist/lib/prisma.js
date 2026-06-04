import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
if (!process.env.DATABASE_URL) {
    throw new Error("A variável de ambiente DATABASE_URL não está configurada.");
}
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export { prisma };
