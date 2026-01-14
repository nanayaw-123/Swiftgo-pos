'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Store,
  AlertTriangle,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Activity
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import Link from 'next/link'

interface DashboardStats {
  todayRevenue: number
  monthlyRevenue: number
  avgTransactionValue: number
  totalProducts: number
  totalStores: number
  totalStaff: number
  lowStockCount: number
  revenueData: { date: string; revenue: number }[]
  storePerformance: { store: string; revenue: number }[]
  topProducts: { name: string; sales: number; revenue: number }[]
}

export const OwnerDashboard = ({ tenantId }: { tenantId: string }) => {
  const { getToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Business Overview</h1>
        <p className="text-muted-foreground mt-1">
          Complete insights into your business performance
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Today
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
          <p className="text-3xl font-bold">₵{stats.todayRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Live updates
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="secondary">This Month</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold">₵{stats.monthlyRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            +{((stats.monthlyRevenue / (stats.revenueData.length || 1)) * 100).toFixed(1)}% vs last period
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge variant="secondary">Average</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Avg Transaction</p>
          <p className="text-3xl font-bold">₵{stats.avgTransactionValue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Per sale value
          </p>
        </Card>
      </div>

      {/* Business Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalStores}</p>
              <p className="text-xs text-muted-foreground">Store Locations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalStaff}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-orange-200 dark:border-orange-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">7-Day Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₵${Number(value).toFixed(2)}`} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Store Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Store Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.storePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="store" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${Number(value).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                  </div>
                </div>
                <p className="font-semibold">₵{product.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/dashboard/products">
            <Button variant="outline" className="w-full">
              <Package className="w-4 h-4 mr-2" />
              Manage Products
            </Button>
          </Link>
          <Link href="/dashboard/users">
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Manage Team
            </Button>
          </Link>
          <Link href="/dashboard/stores">
            <Button variant="outline" className="w-full">
              <Store className="w-4 h-4 mr-2" />
              Manage Stores
            </Button>
          </Link>
          <Link href="/dashboard/billing">
            <Button variant="outline" className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </Button>
          </Link>
          <Link href="/dashboard/audit-logs">
            <Button variant="outline" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Audit Logs
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}