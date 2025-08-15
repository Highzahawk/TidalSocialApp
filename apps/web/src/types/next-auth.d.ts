import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    tidalUserId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    tidalUserId?: string
  }
}
