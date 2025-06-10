'use client'

import { 
  HomeIcon, 
  VideoCameraIcon, 
  CalendarIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  CreditCardIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  LifebuoyIcon,
  CpuChipIcon,
  XMarkIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'

interface SidebarNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isAdmin: boolean
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const getSidebarNavigation = (isAdmin: boolean): NavigationItem[] => [
  { name: 'Dashboard', href: 'dashboard', icon: HomeIcon },
  { name: 'Videos', href: 'uploads', icon: VideoCameraIcon },
  { name: 'Clips', href: 'clips', icon: RectangleStackIcon },
  { name: 'AI Enhancement', href: 'ai', icon: SparklesIcon },
  { name: 'Calendar', href: 'calendar', icon: CalendarIcon },
  { name: 'Analytics', href: 'analytics', icon: ChartBarIcon },
  { name: 'Workflows', href: 'workflows', icon: Cog6ToothIcon },
  { name: 'Workspaces', href: 'workspaces', icon: BuildingOfficeIcon },
  { name: 'Support', href: 'support', icon: LifebuoyIcon },
  ...(isAdmin ? [{ name: 'Admin Portal', href: 'admin', icon: ShieldCheckIcon }] : []),
  ...(isAdmin ? [{ name: 'System Monitor', href: 'monitor', icon: CpuChipIcon }] : []),
]

const getBottomNavigation = (): NavigationItem[] => [
  { name: 'Profile', href: 'profile', icon: UserIcon },
  { name: 'Subscription', href: 'subscription', icon: CreditCardIcon },
  { name: 'Support', href: 'support', icon: LifebuoyIcon },
]

export function SidebarNavigation({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen, 
  isAdmin 
}: SidebarNavigationProps) {
  const sidebarNavigation = getSidebarNavigation(isAdmin)
  const bottomNavigation = getBottomNavigation() // eslint-disable-line @typescript-eslint/no-unused-vars

  const SidebarContent = () => (
    <>
      <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex-shrink-0 flex items-center px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">C</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">ContentWizard</h1>
            </div>
          </div>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {sidebarNavigation.map((item) => {
            const isActive = activeTab === item.href
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.href)}
                className={`${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white hover:text-black'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <item.icon
                  className={`${isActive ? 'text-black' : 'text-white'} mr-3 flex-shrink-0 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-zinc-800 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-800">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User Account</p>
              <p className="text-xs text-zinc-400">Manage settings</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-black">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-black overflow-y-auto">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
