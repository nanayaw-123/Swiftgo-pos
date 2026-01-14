"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard,
  FileText,
  Store,
  Menu,
  X,
  Brain,
  AlertTriangle,
  TrendingUp,
  LogOut,
  Building2,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Bell,
  Wallet,
  Calendar,
  Tag,
  Star,
  Globe,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier'] },
  { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier'] },
  { name: 'Products', href: '/dashboard/products', icon: Package, roles: ['owner', 'manager'] },
  { name: 'Inventory', href: '/dashboard/inventory', icon: AlertTriangle, roles: ['owner', 'manager'] },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: Building2, roles: ['owner', 'manager'] },
  { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: FileText, roles: ['owner', 'manager'] },
  { name: 'Stock Transfers', href: '/dashboard/stock-transfers', icon: ArrowRightLeft, roles: ['owner', 'manager'] },
  { name: 'Expiry Tracking', href: '/dashboard/expiry-tracking', icon: Clock, roles: ['owner', 'manager'] },
  { name: 'Reorder Points', href: '/dashboard/reorder-points', icon: RefreshCw, roles: ['owner', 'manager'] },
    { name: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['owner', 'manager'] },
    { name: 'Debt Tracking', href: '/dashboard/debt', icon: CreditCard, roles: ['owner', 'manager'] },
    { name: 'Loyalty Program', href: '/dashboard/loyalty', icon: Star, roles: ['owner', 'manager'] },

  { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, roles: ['owner', 'manager'] },
  { name: 'Payroll', href: '/dashboard/payroll', icon: Wallet, roles: ['owner', 'manager'] },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar, roles: ['owner', 'manager'] },
  { name: 'Discounts', href: '/dashboard/discounts', icon: Tag, roles: ['owner', 'manager'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp, roles: ['owner', 'manager'] },
  { name: 'Sales', href: '/dashboard/sales', icon: BarChart3, roles: ['owner', 'manager', 'cashier'] },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Brain, roles: ['owner', 'manager'] },
  { name: 'Staff', href: '/dashboard/staff', icon: Users, roles: ['owner', 'manager'] },
  { name: 'Stores', href: '/dashboard/stores', icon: Store, roles: ['owner', 'manager'] },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Globe, roles: ['owner'] },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, roles: ['owner', 'manager', 'cashier'] },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, roles: ['owner'] },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, roles: ['owner', 'manager'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['owner', 'manager', 'cashier'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useUserRole()
  const { user, profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = allNavigation.filter(item => 
    !role || item.roles.includes(role)
  )

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">SwiftPOS</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8 cursor-pointer" onClick={handleSignOut}>
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-40 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-foreground">SwiftPOS</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Desktop User Section */}
          <div className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium block text-foreground">
                  {profile?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
                {role && (
                  <span className="text-xs text-muted-foreground capitalize">{role}</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}