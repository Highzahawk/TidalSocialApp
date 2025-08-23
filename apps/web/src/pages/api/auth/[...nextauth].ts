import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { env } from '../../../env';

export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('JWT callback - token:', token);
        console.log('JWT callback - user:', user);
        console.log('JWT callback - account:', account);
      }
      
      // Handle our custom JWT structure
      if (token.tidalUserId && token.accessToken) {
        // This is our custom JWT from TIDAL OAuth
        return token;
      }
      
      if (user) {
        token.tidalUserId = (user as any).tidalUserId;
        token.sub = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Session callback - session:', session);
        console.log('Session callback - token:', token);
      }
      
      if (session.user) {
        (session.user as any).id = token.sub as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).tidalUserId = token.tidalUserId;
      return session;
    }
  },
  session: { strategy: 'jwt' },
  secret: env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
