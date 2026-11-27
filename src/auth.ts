import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/src/shared/db";
import { verifyPassword } from "@/src/modules/auth/password";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret : process.env.AUTH_SECRET!,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: { type: "password" } },
    async authorize(input) {
      const parsed = credentialsSchema.safeParse(input);
      if (!parsed.success) return null;
      const photographer = await db.photographer.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        select: { id: true, name: true, email: true, passwordHash: true },
      });
      if (!photographer || !verifyPassword(parsed.data.password, photographer.passwordHash)) return null;
      return { id: photographer.id, name: photographer.name, email: photographer.email };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) token.photographerId = user.id; return token; },
    session({ session, token }) { if (session.user) session.user.photographerId = String(token.photographerId ?? ""); return session; },
  },
});
