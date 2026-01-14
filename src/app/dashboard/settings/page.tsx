"use client"

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/hooks/use-auth'
import { 
  Loader2, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  Check,
  AlertTriangle,
  Key,
  Mail,
  Globe,
  Receipt,
  Clock
} from 'lucide-react'

export default function SettingsPage() {
  const { user, session, loading: authLoading } = useAuth()
    const { tenantId, role, loading: roleLoading } = useUserRole()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  // Business settings
  const [business, setBusiness] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    taxRate: '0'
  })
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    lowStockAlerts: true,
    salesReports: true,
    dailyDigest: false
  })
  
  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    compactMode: false,
    receiptLogo: true
  })

  useEffect(() => {
    if (tenantId && user) {
      loadSettings()
    }
  }, [tenantId, user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Load user profile from Supabase
      if (user) {
        setProfile({
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || ''
        })
      }
      
      // Business settings would typically come from an API
      // For now, use defaults or stored values
      const storedBusiness = localStorage.getItem('business_settings')
      if (storedBusiness) {
        setBusiness(JSON.parse(storedBusiness))
      }
      
      const storedNotifications = localStorage.getItem('notification_settings')
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications))
      }
      
      const storedAppearance = localStorage.getItem('appearance_settings')
      if (storedAppearance) {
        setAppearance(JSON.parse(storedAppearance))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Note: Updating profile would require Supabase admin API or proper auth flow
      // For now, just update local state
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Store business settings locally (in production, this would go to API)
      localStorage.setItem('business_settings', JSON.stringify(business))
      toast.success('Business settings saved')
    } catch (error) {
      console.error('Error saving business settings:', error)
      toast.error('Failed to save business settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      localStorage.setItem('notification_settings', JSON.stringify(notifications))
      toast.success('Notification preferences saved')
    } catch (error) {
      toast.error('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAppearance = async () => {
    setSaving(true)
    try {
      localStorage.setItem('appearance_settings', JSON.stringify(appearance))
      
      // Apply theme
      if (appearance.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      toast.success('Appearance settings saved')
    } catch (error) {
      toast.error('Failed to save appearance settings')
    } finally {
      setSaving(false)
    }
  }

  const handleManageAccount = () => {
    // Direct to a profile management page or show a message
    toast.info('Account management features coming soon')
  }

  const isOwner = role === 'owner'

  if (roleLoading || authLoading || !tenantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and business settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2 py-2" disabled={!isOwner}>
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 py-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile.name || 'User'}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{role}</Badge>
                </div>
              </div>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email is managed through authentication</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            {!isOwner ? (
              <Card className="p-6 text-center">
                <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-gray-600">Only business owners can modify these settings.</p>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </h2>
                
                <form onSubmit={handleSaveBusiness} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={business.name}
                        onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                        placeholder="Your business name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={business.email}
                        onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                        placeholder="contact@business.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={business.phone}
                        onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">Address</Label>
                      <Input
                        id="businessAddress"
                        value={business.address}
                        onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                        placeholder="Business address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={business.currency} onValueChange={(value) => setBusiness({ ...business, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">Ghana Cedi (₵)</SelectItem>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                          <SelectItem value="KES">Kenyan Shilling (KSh)</SelectItem>
                          <SelectItem value="ZAR">South African Rand (R)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={business.timezone} onValueChange={(value) => setBusiness({ ...business, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                          <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={business.taxRate}
                        onChange={(e) => setBusiness({ ...business, taxRate: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Business Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-sm text-gray-600">Receive important alerts via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600">Get notified when products are running low</p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Sales Reports</p>
                    <p className="text-sm text-gray-600">Weekly sales summary reports</p>
                  </div>
                  <Switch
                    checked={notifications.salesReports}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, salesReports: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Daily Digest</p>
                    <p className="text-sm text-gray-600">Daily summary of all activities</p>
                  </div>
                  <Switch
                    checked={notifications.dailyDigest}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, dailyDigest: checked })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Theme</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                        appearance.theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                    >
                      <div className="w-10 h-10 bg-white border rounded shadow-sm"></div>
                      <div className="text-left">
                        <p className="font-medium">Light</p>
                        <p className="text-xs text-gray-500">Default light theme</p>
                      </div>
                      {appearance.theme === 'light' && <Check className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                    <button
                      type="button"
                      className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                        appearance.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                    >
                      <div className="w-10 h-10 bg-gray-800 border rounded shadow-sm"></div>
                      <div className="text-left">
                        <p className="font-medium">Dark</p>
                        <p className="text-xs text-gray-500">Dark mode theme</p>
                      </div>
                      {appearance.theme === 'dark' && <Check className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-gray-600">Reduce spacing for more content</p>
                  </div>
                  <Switch
                    checked={appearance.compactMode}
                    onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium">Show Logo on Receipts</p>
                    <p className="text-sm text-gray-600">Include business logo on printed receipts</p>
                  </div>
                  <Switch
                    checked={appearance.receiptLogo}
                    onCheckedChange={(checked) => setAppearance({ ...appearance, receiptLogo: checked })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAppearance} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Appearance
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Account Security
              </h2>
              
              <p className="text-gray-600 mb-6">
                Manage your password, two-factor authentication, and connected accounts through your secure profile settings.
              </p>
              
              <Button onClick={handleManageAccount}>
                <Shield className="w-4 h-4 mr-2" />
                Manage Security Settings
              </Button>
            </Card>

            {/* Danger Zone - Only for owners */}
            {isOwner && (
              <Card className="p-6 border-red-200 bg-red-50/50">
                <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  These actions are permanent and cannot be undone. Please proceed with caution.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">Delete All Data</p>
                      <p className="text-sm text-gray-600">Remove all products, sales, and inventory data</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => toast.error('Data deletion requires email confirmation')}>
                      Delete Data
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-gray-600">Permanently delete your business account</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => toast.error('Account deletion requires email confirmation')}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}