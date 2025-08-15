import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { prisma } from '../../../lib/prisma';
import { env } from '../../../env';

// Using credentials provider for now - we'll implement full OAuth later
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'tidal',
      name: 'TIDAL',
      credentials: {
        username: { label: 'TIDAL Username', type: 'text' },
        accessToken: { label: 'Access Token', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.username) return null;
        
        // For now, create a mock user - we'll implement real OAuth later
        const user = await prisma.user.upsert({
          where: { tidalUserId: credentials.username },
          update: {
            tidalAccessToken: credentials.accessToken || 'dev-token',
            tidalRefreshToken: 'dev-refresh',
            tidalExpiresAt: new Date(Date.now() + 3600_000)
          },
          create: {
            tidalUserId: credentials.username,
            tidalAccessToken: credentials.accessToken || 'dev-token',
            tidalRefreshToken: 'dev-refresh',
            tidalExpiresAt: new Date(Date.now() + 3600_000),
            displayName: credentials.username
          }
        });
        
        return { 
          id: user.id, 
          name: user.displayName ?? user.tidalUserId,
          email: `${user.tidalUserId}@tidal.com`
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // For credentials provider, user data is available on first sign in
      if (user) {
        token.tidalUserId = user.name; // Using name as TIDAL user ID for now
        token.accessToken = 'dev-token';
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.tidalUserId = token.tidalUserId;
      return session;
    }
  },
  session: { strategy: 'jwt' },
  secret: env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
