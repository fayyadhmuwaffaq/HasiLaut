export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.role = user.role;
        token.sellerStatus = user.seller_status ?? null;
        token.fullName = user.full_name ?? user.name ?? "";
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.invalid || !token?.id) {
        session.user = null;
        return session;
      }

      if (session.user) {
        session.user.id = Number(token.id);
        session.user.role = token.role;
        session.user.seller_status = token.sellerStatus ?? null;
        session.user.full_name = token.fullName;
        session.user.name = token.fullName;
        session.user.email = token.email ?? session.user.email;
      }

      return session;
    },
  },
};
