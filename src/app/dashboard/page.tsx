"use client"

import DashboardLayout from '@/components/DashboardLayout'
import { useUserRole } from '@/hooks/useUserRole'
import { OwnerDashboard } from '@/components/dashboards/OwnerDashboard'
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard'
import { CashierDashboard } from '@/components/dashboards/CashierDashboard'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { role, loading, tenantId, userId } = useUserRole()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center animate-fade-in-up">
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 animate-pulse">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!role || !tenantId) {
    return (
      <DashboardLayout>
        <Card className="p-8 sm:p-12 text-center glass-card shadow-premium animate-fade-in-up">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white">Setup Required</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Please complete onboarding to access your dashboard.
          </p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        {role === 'owner' && <OwnerDashboard tenantId={tenantId} />}
        {role === 'manager' && <ManagerDashboard tenantId={tenantId} />}
        {role === 'cashier' && userId && <CashierDashboard tenantId={tenantId} userId={userId} />}
      </div>
    </DashboardLayout>
  )
}