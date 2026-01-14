"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, User, Zap } from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// App URL for external links
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()
  const role = profile?.role

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
    }
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U"
    const first = firstName?.[0] || ""
    const last = lastName?.[0] || ""
    return (first + last).toUpperCase()
  }

  const getFullName = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "User"
    return `${firstName || ""} ${lastName || ""}`.trim()
  }

  const getRoleBadgeColor = (userRole: string | null) => {
    switch(userRole) {
      case 'owner': return 'bg-purple-500'
      case 'manager': return 'bg-blue-500'
      case 'cashier': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-electric rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-electric bg-clip-text text-transparent">
              SwiftPOS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/features" className="text-foreground/70 hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-foreground/70 hover:text-primary transition-colors">
              Pricing
            </Link>
            <ThemeToggle />
              {!loading && user ? (
                <>
                  <NotificationCenter />
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                    <span>Dashboard</span></Link>
                  </Button>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile?.first_name, profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getFullName(profile?.first_name, profile?.last_name)}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        {role && (
                          <Badge className={`${getRoleBadgeColor(role)} text-white text-xs mt-1 w-fit`}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
              ) : !loading ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">
                    <span>Sign In</span>
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">
                    <span>Get Started</span>
                    </Link>
                  </Button>
                </>
              ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {!loading && user && <NotificationCenter />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/features"
              className="block text-foreground/70 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block text-foreground/70 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            {!loading && user ? (
              <>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {getFullName(profile?.first_name, profile?.last_name)}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      {role && (
                        <Badge className={`${getRoleBadgeColor(role)} text-white text-xs mt-1`}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : !loading ? (
              <>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                 <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full">
                  <span>Get Started</span>
                </Button>
              </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  )
}