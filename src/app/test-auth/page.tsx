'use client'

import React, { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function TestAuthPage() {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <p>Status: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{status}</span></p>
            <p>Mounted: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{mounted ? 'true' : 'false'}</span></p>
          </div>

          {status === 'loading' && (
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading session...</p>
            </div>
          )}

          {status === 'authenticated' && session && (
            <div className="bg-green-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">✅ Authenticated</h2>
              <p>Email: {session.user?.email}</p>
              <p>Name: {session.user?.name}</p>
              <button 
                onClick={() => signOut()}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          )}

          {status === 'unauthenticated' && (
            <div className="bg-orange-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">🔓 Not Authenticated</h2>
              <div className="space-x-4">
                <button 
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign in with Google
                </button>
                <button 
                  onClick={() => signIn('credentials')}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Sign in with Email
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Raw Session Data</h2>
            <pre className="text-sm bg-white p-2 rounded overflow-auto">
              {JSON.stringify({ session, status }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
