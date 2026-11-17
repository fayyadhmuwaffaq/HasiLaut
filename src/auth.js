import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const result = await query(
          `SELECT id, full_name, email, password_hash, role, seller_status
           FROM users
           WHERE LOWER(email) = $1
           LIMIT 1`,
          [email]
        );

        const user = result.rows[0];
        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          full_name: user.full_name,
          name: user.full_name,
          email: user.email,
          role: user.role,
          seller_status: user.seller_status,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        return authConfig.callbacks.jwt({ token, user });
      }

      if (trigger === "update" && token?.id) {
        const result = await query(
          `SELECT id, full_name, email, role, seller_status
           FROM users
           WHERE id = $1
           LIMIT 1`,
          [Number(token.id)]
        );

        const freshUser = result.rows[0];
        if (!freshUser) {
          return { ...token, invalid: true };
        }

        token.role = freshUser.role;
        token.sellerStatus = freshUser.seller_status ?? null;
        token.fullName = freshUser.full_name;
        token.email = freshUser.email;
        delete token.invalid;
      }

      return token;
    },
  },
});
