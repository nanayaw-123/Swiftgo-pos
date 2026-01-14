'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  UserCheck, 
  Shield,
  Loader2,
  Mail,
  ShoppingCart
} from 'lucide-react'

export default function SetupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const userRole = user?.user_metadata?.role
  const userName = user?.user_metadata?.first_name || 'User'
  const companyName = user?.user_metadata?.company_name || 'a company'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShoppingCart className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">SwiftPOS</h1>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome, {userName}! 👋
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your account has been created successfully
          </p>
        </div>

        {/* Pending Access Card */}
        <Card className="p-8 mb-8 border-orange-500 bg-orange-50 dark:bg-orange-900/10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Account Pending Activation
            </h3>
            
            <div className="mb-6 space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                You've registered as a <Badge variant="secondary" className="mx-1 capitalize">{userRole}</Badge> for <strong>{companyName}</strong>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Your account is waiting to be added to a business by an owner.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4 flex items-center justify-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Next Steps
              </h4>
              <div className="text-left space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p>Contact your business owner and provide them with your email: <strong className="text-primary">{user?.email}</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p>The owner will add you to their tenant from the <strong>Team Members</strong> section in their dashboard</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p>Once added, you'll receive access and can log in to your dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/login">
                  <Shield className="w-4 h-4 mr-2" />
                  Try Login
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:owner@example.com?subject=SwiftPOS Access Request&body=Hi, I've created an account with email ${user?.email} and would like to be added as a ${userRole} to your SwiftPOS tenant.`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Owner
                </a>
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-2">Are you a business owner?</p>
              <p>If you own a business, please <Link href="/register" className="text-primary hover:underline font-medium">create a new account</Link> and select "Owner" as your role to set up your own business.</p>
            </div>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-primary hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}