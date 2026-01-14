'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Award,
  Info
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import Link from 'next/link'

interface CashierStats {
  todaySales: number
  todayTransactions: number
  avgSale: number
  dailyGoal: number
  revenueData: { date: string; revenue: number }[]
  recentSales: { id: string; total: number; items: number; timestamp: string }[]
}

export const CashierDashboard = ({ tenantId, userId }: { tenantId: string, userId: string }) => {
  const { session } = useAuth()
  const [stats, setStats] = useState<CashierStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCashierStats()
  }, [])

  const getAuthToken = () => {
    return localStorage.getItem('bearer_token') || session?.access_token || ''
  }

  const fetchCashierStats = async () => {
    try {
      const token = getAuthToken()
      
      // Fetch sales data
      const salesResponse = await fetch('/api/sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (salesResponse.ok) {
        const sales = await salesResponse.json()
        
        // Calculate today's stats
        const today = new Date().toISOString().split('T')[0]
        const todaySales = sales.filter((sale: any) => 
          sale.created_at.startsWith(today)
        )
        
        const todayRevenue = todaySales.reduce((sum: number, sale: any) => 
          sum + parseFloat(sale.total_amount), 0
        )
        
        // Calculate 7-day revenue
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toISOString().split('T')[0]
        })
        
        const revenueByDate = last7Days.map(date => {
          const daySales = sales.filter((sale: any) => 
            sale.created_at.startsWith(date)
          )
          const revenue = daySales.reduce((sum: number, sale: any) => 
            sum + parseFloat(sale.total_amount), 0
          )
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue
          }
        })
        
        setStats({
          todaySales: todayRevenue,
          todayTransactions: todaySales.length,
          avgSale: todaySales.length > 0 ? todayRevenue / todaySales.length : 0,
          dailyGoal: 500,
          revenueData: revenueByDate,
          recentSales: todaySales.slice(0, 5).map((sale: any) => ({
            id: sale.id,
            total: parseFloat(sale.total_amount),
            items: sale.items_count || 0,
            timestamp: sale.created_at
          }))
        })
      }
    } catch (error) {
      console.error('Failed to fetch cashier stats:', error)
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

  const goalProgress = (stats.todaySales / stats.dailyGoal) * 100
  const performanceLevel = stats.todayTransactions > 20 ? 'Excellent' : 
                          stats.todayTransactions > 10 ? 'Good' : 'Getting Started'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">My Performance</h1>
        <p className="text-muted-foreground mt-1">
          Track your sales and hit your daily goals
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Today
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">My Sales Today</p>
          <p className="text-3xl font-bold">₵{stats.todaySales.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Keep it up!
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="secondary">Count</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Transactions</p>
          <p className="text-3xl font-bold">{stats.todayTransactions}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Sales processed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge variant="secondary">Average</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Avg Sale Value</p>
          <p className="text-3xl font-bold">₵{stats.avgSale.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Per transaction
          </p>
        </Card>
      </div>

      {/* Daily Goal Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Goal Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Target: ₵{stats.dailyGoal.toFixed(2)}
            </p>
          </div>
          <Badge variant={goalProgress >= 100 ? "default" : "secondary"} className="text-lg px-4 py-2">
            {goalProgress.toFixed(0)}%
          </Badge>
        </div>
        <Progress value={Math.min(goalProgress, 100)} className="h-3 mb-3" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            ₵{stats.todaySales.toFixed(2)} of ₵{stats.dailyGoal.toFixed(2)}
          </span>
          <span className="font-medium text-primary">
            {goalProgress >= 100 ? '🎉 Goal Achieved!' : 
             `₵${(stats.dailyGoal - stats.todaySales).toFixed(2)} to go`}
          </span>
        </div>
      </Card>

      {/* Performance Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">My 7-Day Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stats.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₵${Number(value).toFixed(2)}`} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Sales */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">My Recent Sales</h3>
        <div className="space-y-3">
          {stats.recentSales.length > 0 ? (
            stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">₵{sale.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.items} items • {new Date(sale.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No sales yet today</p>
              <Link href="/pos">
                <Button className="mt-4">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Selling
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Performance Tips */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Performance Level: {performanceLevel}</h3>
            <p className="text-muted-foreground mb-4">
              {stats.todayTransactions > 20 
                ? "Amazing work! You're on fire today. Keep up the excellent service!"
                : stats.todayTransactions > 10
                ? "Great job! You're having a productive day. A few more sales to reach excellence!"
                : "Welcome to your shift! Process more sales to boost your performance level."}
            </p>
            <div className="flex gap-2">
              <Link href="/pos">
                <Button size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Open POS Terminal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          POS Quick Guide
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><kbd className="px-2 py-1 bg-muted rounded text-xs">F1</kbd> Search Products</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-xs">F2</kbd> Quick Checkout</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-xs">F3</kbd> Clear Cart</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Tips for Success</h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Greet every customer warmly</li>
              <li>Double-check quantities</li>
              <li>Offer receipts to all customers</li>
              <li>Keep your workspace organized</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}