"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCart, Store, Phone, DollarSign, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading, onboardingStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'shop',
    phone: '',
    currency: 'GHS',
    storeName: 'Main Store',
    storeLocation: ''
  })

  // Redirect if already onboarded
  useEffect(() => {
    if (!authLoading && onboardingStatus === 'ONBOARDED') {
      router.replace('/dashboard')
    }
  }, [authLoading, onboardingStatus, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (authLoading) return
    if (!user) {
      router.push('/login?redirect=/onboarding')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('complete_onboarding', {
        p_business_name: formData.businessName,
        p_business_type: formData.businessType,
        p_currency: formData.currency,
        p_store_name: formData.storeName,
        p_store_location: formData.storeLocation,
        p_phone: formData.phone
      })

      if (error) throw error
      
      toast.success('Welcome to SwiftPOS! Your account is ready.')
      
      // Force a hard navigation to dashboard to refresh all state
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Setting up your account...</p>
        </div>
      </div>
    )
  }

  // If no user after auth check, will redirect (handled in useEffect if we added it, but let's be safe)
  if (!user && !authLoading) {
    router.push('/login?redirect=/onboarding')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-3xl p-6 sm:p-8">
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-primary mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome to SwiftPOS</h1>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
          Let's set up your business account in minutes
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Business Information</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g., Kwame's Supermart"
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="boutique">Boutique</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Café / Bar</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+233 XX XXX XXXX"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS - Ghana Cedi (₵)</SelectItem>
                      <SelectItem value="NGN">NGN - Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling (KSh)</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* First Store/Branch */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">First Store / Branch</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="e.g., Main Branch"
                />
              </div>

              <div>
                <Label htmlFor="storeLocation">Location *</Label>
                <Input
                  id="storeLocation"
                  required
                  value={formData.storeLocation}
                  onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
                  placeholder="e.g., Accra Central"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Complete Setup & Go to Dashboard
              </>
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </Card>
    </div>
  )
}
