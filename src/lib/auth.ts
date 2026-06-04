import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

// Validação das variáveis de ambiente em tempo de inicialização
const requiredEnvs = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "FRONTEND_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

for (const envName of requiredEnvs) {
  if (!process.env[envName]) {
    throw new Error(`A variável de ambiente obrigatória ${envName} não está configurada.`);
  }
}

export const auth = betterAuth({
    appName: "GLI",

    baseURL: process.env.BETTER_AUTH_URL,

    trustedOrigins: [
        process.env.FRONTEND_URL as string,
        (process.env.FRONTEND_URL as string).replace(/\/$/, ""),
    ],

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
});