import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { prisma } from '../../../lib/prisma';

// Placeholder credentials provider – replace with real TIDAL + Last.fm OAuth
import Credentials from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Dev Login',
      credentials: { username: { label: 'Username' } },
      async authorize(creds) {
        if (!creds?.username) return null;
        const user = await prisma.user.upsert({
          where: { tidalUserId: creds.username },
          update: {},
          create: {
            tidalUserId: creds.username,
            tidalAccessToken: 'dev',
            tidalRefreshToken: 'dev',
            tidalExpiresAt: new Date(Date.now() + 3600_000)
          }
        });
        return { id: user.id, name: user.displayName ?? user.tidalUserId } as any;
      }
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
