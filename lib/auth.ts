import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import type { Role } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Server-side role gate for route handlers: the session if the user has one of `roles`, else null. */
export async function sessionWithRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) return null;
  return session;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tier: user.tier,
        };
      },
    }),
  ],
});
