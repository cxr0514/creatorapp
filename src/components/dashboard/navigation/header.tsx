'use client'

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
  session: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function Header({ setSidebarOpen, session }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card border-b border-border shadow">
      <button
        type="button"
        className="px-4 border-r border-border text-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-muted focus-within:text-foreground">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-foreground placeholder-muted focus:outline-none focus:placeholder-muted-foreground focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
                placeholder="Search videos or workflows..."
                type="search"
              />
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <Button variant="ghost" size="sm">
            <BellIcon className="h-5 w-5" />
          </Button>
          
          <div className="relative">
            <div className="max-w-xs bg-card rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary lg:p-2 lg:rounded-md lg:hover:bg-muted">
              <div className="flex items-center space-x-2">
                {session?.user?.image ? (
                  <Image
                    className="h-8 w-8 rounded-full"
                    src={session.user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div className="hidden lg:block">
                  <div className="text-sm font-medium text-foreground">
                    {session?.user?.name || session?.user?.email || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session?.user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
