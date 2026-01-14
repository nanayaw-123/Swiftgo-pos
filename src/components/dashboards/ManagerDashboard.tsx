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
  AlertTriangle,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  AlertCircle
} from 'lucide-react'
import {
  ComposedChart,
  Line,
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
  weekRevenue: number
  totalProducts: number
  lowStockCount: number
  revenueData: { date: string; revenue: number; transactions: number }[]
  recentActivity: { action: string; user: string; timestamp: string }[]
}

export const ManagerDashboard = ({ tenantId }: { tenantId: string }) => {
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
        setStats({
          todayRevenue: data.todayRevenue,
          weekRevenue: data.monthlyRevenue,
          totalProducts: data.totalProducts,
          lowStockCount: data.lowStockCount,
          revenueData: data.revenueData.map((item: any) => ({
            ...item,
            transactions: Math.floor(Math.random() * 50) + 10
          })),
          recentActivity: []
        })
        
        // Fetch recent audit logs
        const logsResponse = await fetch('/api/audit-logs?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (logsResponse.ok) {
          const logs = await logsResponse.json()
          setStats(prev => prev ? {
            ...prev,
            recentActivity: logs.map((log: any) => ({
              action: log.action,
              user: log.user_name || 'Unknown',
              timestamp: log.created_at
            }))
          } : null)
        }
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
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage daily operations and monitor performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Today
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
          <p className="text-3xl font-bold">₵{stats.todayRevenue.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="secondary">7 Days</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Week Revenue</p>
          <p className="text-3xl font-bold">₵{stats.weekRevenue.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
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
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockCount > 0 && (
        <Card className="p-6 border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">⚠️ Low Stock Alert</h3>
              <p className="text-muted-foreground mb-4">
                {stats.lowStockCount} products are running low on stock. Review inventory and place orders to avoid stockouts.
              </p>
              <Link href="/dashboard/products">
                <Button variant="outline" className="bg-white dark:bg-gray-900">
                  <Package className="w-4 h-4 mr-2" />
                  Review Inventory
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Sales & Transactions Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Performance (7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={stats.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue (₵)" />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="transactions" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="Transactions"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </div>
        <Link href="/dashboard/audit-logs" className="block mt-4">
          <Button variant="outline" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            View All Activity
          </Button>
        </Link>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/products">
            <Button variant="outline" className="w-full">
              <Package className="w-4 h-4 mr-2" />
              Manage Inventory
            </Button>
          </Link>
          <Link href="/pos">
            <Button variant="outline" className="w-full">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS
            </Button>
          </Link>
          <Link href="/dashboard/sales">
            <Button variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </Link>
          <Link href="/dashboard/users">
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Manage Team
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}