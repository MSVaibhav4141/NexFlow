// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    accountName: string;
    encoded:string;

  }

  interface Session {
    user: {
      id: string;
      accountName: string;
      encoded:string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accountName: string;
    encoded:string
  }
}