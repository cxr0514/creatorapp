import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account }: any) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: async ({ session }: any) => {
      if (session?.user?.email) {
        try {
          // Get the user from database to ensure we have the correct ID
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          })
          if (dbUser) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to dashboard after successful authentication
      return `${baseUrl}/dashboard`
    }
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
