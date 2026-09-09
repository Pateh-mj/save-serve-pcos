import type { NextAuthConfig } from "next-auth";
import type { Role, Tier } from "@/lib/constants";
import { Role as RoleEnum } from "@/lib/constants";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role ?? RoleEnum.PATIENT;
        token.tier = (user as { tier: Tier }).tier ?? "FREE";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.tier = token.tier as Tier;
      }
      return session;
    },
  },
};
