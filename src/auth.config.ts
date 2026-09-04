import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        if (nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
    session({ session, user, token }) {
      if (session.user && token) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = token.role as any;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    }
  },
} satisfies NextAuthConfig;
