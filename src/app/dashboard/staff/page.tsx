"use client"

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Crown,
  Shield,
  User
} from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import { toast } from 'sonner'

interface StaffPerformance {
  staff_id: string
  staff_role: string
  date: string
  total_sales: number
  transactions_count: number
  items_sold: number
  average_transaction_value: number
}

interface StaffSummary {
  total_sales: number
  total_transactions: number
  total_items_sold: number
  average_per_staff: number
}

export default function StaffManagementPage() {
  const { role, loading, userId } = useUserRole()
  const [performanceData, setPerformanceData] = useState<StaffPerformance[]>([])
  const [summary, setSummary] = useState<StaffSummary | null>(null)
  const [dateRange, setDateRange] = useState(30)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStaffPerformance = async () => {
    try {
      const toDate = new Date().toISOString().split('T')[0]
      const fromDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(
        `/api/staff/performance?date_from=${fromDate}&date_to=${toDate}&limit=50`
      )
      
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data.performance_records || [])
        setSummary(data.summary || null)
      } else {
        toast.error('Failed to fetch staff performance')
      }
    } catch (error) {
      console.error('Error fetching staff performance:', error)
      toast.error('Error fetching staff performance')
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await fetchStaffPerformance()
    setIsLoading(false)
    toast.success('Data refreshed')
  }

  useEffect(() => {
    if (!loading) {
      refreshData()
    }
  }, [loading, dateRange])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStaffPerformance()
    }, 60000)

    return () => clearInterval(interval)
  }, [dateRange])

  const getRoleIcon = (staffRole: string) => {
    switch (staffRole) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'cashier':
        return <User className="w-4 h-4 text-green-600" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (staffRole: string) => {
    switch (staffRole) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cashier':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return ''
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  // Check if user has permission to view staff performance
  if (role !== 'owner' && role !== 'manager') {
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Only owners and managers can view staff performance data.
          </p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track team performance and manage access
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === 7 ? 'default' : 'outline'}
              onClick={() => setDateRange(7)}
              size="sm"
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === 30 ? 'default' : 'outline'}
              onClick={() => setDateRange(30)}
              size="sm"
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === 90 ? 'default' : 'outline'}
              onClick={() => setDateRange(90)}
              size="sm"
            >
              90 Days
            </Button>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                  <p className="text-3xl font-bold mt-2">
                    GH₵{summary.total_sales.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                All staff combined
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-3xl font-bold mt-2">
                    {summary.total_transactions.toLocaleString()}
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-primary opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Total processed
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items Sold</p>
                  <p className="text-3xl font-bold mt-2">
                    {summary.total_items_sold.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                All products
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Staff</p>
                  <p className="text-3xl font-bold mt-2">
                    GH₵{summary.average_per_staff.toLocaleString()}
                  </p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Average sales
              </p>
            </Card>
          </div>
        )}

        {/* Staff Performance Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Performance
            <Badge variant="secondary">{performanceData.length}</Badge>
          </h2>

          {performanceData.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No performance data available for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Staff ID</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Sales</th>
                    <th className="text-right py-3 px-4">Transactions</th>
                    <th className="text-right py-3 px-4">Items</th>
                    <th className="text-right py-3 px-4">Avg Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((staff, index) => (
                    <tr key={staff.staff_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">#{index + 1}</span>
                          {index === 0 && <Badge variant="default" className="bg-yellow-600">Top</Badge>}
                          {index === 1 && <Badge variant="secondary">2nd</Badge>}
                          {index === 2 && <Badge variant="secondary">3rd</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {staff.staff_id.slice(0, 8)}...
                          </code>
                          {staff.staff_id === userId && (
                            <Badge variant="default" className="text-xs">You</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadgeColor(staff.staff_role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(staff.staff_role)}
                            {staff.staff_role.charAt(0).toUpperCase() + staff.staff_role.slice(1)}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        GH₵{staff.total_sales.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {staff.transactions_count}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {staff.items_sold}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        GH₵{staff.average_transaction_value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Role Permissions Guide */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Role Permissions</h2>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-yellow-600" />
                <h3 className="font-bold text-lg">Owner</h3>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Full Access
                </Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-9">
                <li>• View all analytics and reports</li>
                <li>• Manage products, inventory, and pricing</li>
                <li>• View staff performance and manage users</li>
                <li>• Access AI insights and predictions</li>
                <li>• Configure system settings and billing</li>
                <li>• Process sales and manage customers</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-lg">Manager</h3>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Management Access
                </Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-9">
                <li>• View analytics and sales reports</li>
                <li>• Manage products and inventory</li>
                <li>• View staff performance</li>
                <li>• Process sales and refunds</li>
                <li>• Acknowledge inventory alerts</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-lg">Cashier</h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Sales Access
                </Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-9">
                <li>• Process sales transactions</li>
                <li>• View product inventory</li>
                <li>• View own sales history</li>
                <li>• Generate sales receipts</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
