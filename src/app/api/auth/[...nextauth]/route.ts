import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('SignIn callback triggered:', { user: user?.email, provider: account?.provider })
      
      if (account?.provider === 'google' && user?.email) {
        try {
          // Check if user exists, create if not
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            },
          })
          console.log('User upserted successfully:', dbUser.id)
          return true
        } catch (error) {
          console.error('Error creating/updating user:', error)
          return false
        }
      }
      return true
    },
    session: async ({ session, token }: any) => {
      if (session?.user?.email) {
        try {
          // Get the user from database to ensure we have the correct ID
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          })
          if (dbUser) {
            (session.user as any).id = dbUser.id
            console.log('Session callback - User ID set:', dbUser.id)
          } else {
            console.log('Session callback - User not found in database:', session.user.email)
          }
        } catch (error) {
          console.error('Error in session callback:', error)
        }
      }
      return session
    },
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/',
    error: '/',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
