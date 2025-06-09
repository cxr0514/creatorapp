import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().min(1),
  
  // Backblaze B2
  B2_BUCKET_NAME: z.string().min(1),
  B2_KEY_ID: z.string().min(1),
  B2_APP_KEY: z.string().min(1),
  B2_ENDPOINT: z.string().min(1),
  
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
});

// Parse and validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
