import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/types";

/**
 * Auth.js (NextAuth v5) credentials stub with RBAC roles.
 * Phase 1: local/dev users from env — models real sessions + roles.
 * Production: replace Credentials with a real IdP (OAuth/OIDC). Do NOT treat this as production-safe.
 */

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: Role;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
  }
}

type DemoUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
};

function demoUsers(): DemoUser[] {
  const users: DemoUser[] = [];
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kietauto.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin-demo";
  users.push({
    id: "admin-1",
    email: adminEmail,
    name: "Admin Demo",
    password: adminPassword,
    role: "admin",
  });

  const editorEmail = process.env.EDITOR_EMAIL ?? "editor@kietauto.local";
  const editorPassword = process.env.EDITOR_PASSWORD ?? "editor-demo";
  users.push({
    id: "editor-1",
    email: editorEmail,
    name: "Editor Demo",
    password: editorPassword,
    role: "editor",
  });

  return users;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "phase1-dev-secret-change-me",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/vi/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        const user = demoUsers().find(
          (u) => u.email.toLowerCase() === email && u.password === password,
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = token.role as Role | undefined;
      }
      return session;
    },
  },
});

export function hasRole(
  role: Role | undefined,
  allowed: Role[],
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
