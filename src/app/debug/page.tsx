'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Debug information for authentication flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Session Status:</h3>
            <p className="font-mono bg-muted p-2 rounded">{status}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Session Data:</h3>
            <pre className="font-mono bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="flex gap-2">
            {!session ? (
              <Button onClick={() => signIn('google')}>
                Sign In with Google
              </Button>
            ) : (
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Environment Check:</h3>
            <ul className="space-y-1">
              <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'Not set'}</li>
              <li>Base URL: {typeof window !== 'undefined' ? window.location.origin : 'Server side'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
