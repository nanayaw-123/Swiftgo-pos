"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/client'
import { waitForOrCreateProfile } from "@/lib/supabase-retry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.session && data.user) {
        // Use retry logic to ensure profile exists
        try {
          await waitForOrCreateProfile(
            data.user.id,
            data.user.email!,
            {
              role: data.user.user_metadata?.role || 'owner',
              firstName: data.user.user_metadata?.first_name || '',
              lastName: data.user.user_metadata?.last_name || '',
            }
          )
          
          toast.success("Signed in successfully!")
          
          // AuthGate in layout will handle redirection automatically
          // We redirect to / to let AuthGate decide based on onboarding status
          router.push('/')
        } catch (err) {
          console.error("Profile check failed:", err)
          toast.success("Signed in successfully!")
          router.push('/') 
        }
      }
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">SwiftPOS</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Sign in to your account</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
