"use client"

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Package,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import { toast } from 'sonner'

interface RevenueReport {
  period: string
  total_sales: number
  total_transactions: number
  average_transaction_value: number
  by_payment_method: {
    cash: { count: number; total: number }
    card: { count: number; total: number }
    mobile_money: { count: number; total: number }
  }
  previous_period: {
    total_sales: number
    change_percentage: number
  }
}

interface BestSeller {
  product_id: number
  product_name: string
  sku: string
  category: string
  quantity_sold: number
  total_revenue: number
  unit_price: number
}

interface PeakHour {
  hour: number
  hour_label: string
  transactions: number
  total_sales: number
}

export default function AnalyticsPage() {
  const { role, loading } = useUserRole()
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null)
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [busiestHour, setBusiestHour] = useState<PeakHour | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`/api/analytics/sales-reports?period=${period}&type=revenue`)
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data)
      } else {
        toast.error('Failed to fetch revenue data')
      }
    } catch (error) {
      console.error('Error fetching revenue:', error)
    }
  }

  const fetchBestSellers = async () => {
    try {
      const response = await fetch(`/api/analytics/sales-reports?period=${period}&type=best-sellers`)
      if (response.ok) {
        const data = await response.json()
        setBestSellers(data.best_sellers || [])
      }
    } catch (error) {
      console.error('Error fetching best sellers:', error)
    }
  }

  const fetchPeakHours = async () => {
    try {
      const response = await fetch(`/api/analytics/sales-reports?period=${period}&type=peak-hours`)
      if (response.ok) {
        const data = await response.json()
        setPeakHours(data.peak_hours || [])
        setBusiestHour(data.busiest_hour || null)
      }
    } catch (error) {
      console.error('Error fetching peak hours:', error)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchRevenueData(),
      fetchBestSellers(),
      fetchPeakHours()
    ])
    setIsLoading(false)
    toast.success('Data refreshed')
  }

  useEffect(() => {
    if (!loading) {
      refreshData()
    }
  }, [loading, period])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRevenueData()
      fetchBestSellers()
      fetchPeakHours()
    }, 60000)

    return () => clearInterval(interval)
  }, [period])

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sales Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive sales reports and insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 'today' ? 'default' : 'outline'}
              onClick={() => setPeriod('today')}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              onClick={() => setPeriod('week')}
              size="sm"
            >
              Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              onClick={() => setPeriod('month')}
              size="sm"
            >
              Month
            </Button>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Revenue Overview Cards */}
        {revenueData && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">
                    GH₵{revenueData.total_sales.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getChangeIcon(revenueData.previous_period.change_percentage)}
                    <span className={`text-sm font-semibold ${getChangeColor(revenueData.previous_period.change_percentage)}`}>
                      {Math.abs(revenueData.previous_period.change_percentage).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-600">vs previous</span>
                  </div>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-3xl font-bold mt-2">
                    {revenueData.total_transactions.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 text-primary opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Total number of sales
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction</p>
                  <p className="text-3xl font-bold mt-2">
                    GH₵{revenueData.average_transaction_value.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Average per transaction
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Busiest Hour</p>
                  <p className="text-3xl font-bold mt-2">
                    {busiestHour?.hour_label || 'N/A'}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {busiestHour?.transactions || 0} transactions
              </p>
            </Card>
          </div>
        )}

        {/* Payment Method Breakdown */}
        {revenueData && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Method Breakdown
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cash</p>
                <p className="text-2xl font-bold">
                  GH₵{revenueData.by_payment_method.cash.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {revenueData.by_payment_method.cash.count} transactions
                </p>
                <div className="mt-2 bg-green-200 dark:bg-green-800 h-2 rounded-full">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(revenueData.by_payment_method.cash.total / revenueData.total_sales) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Card</p>
                <p className="text-2xl font-bold">
                  GH₵{revenueData.by_payment_method.card.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {revenueData.by_payment_method.card.count} transactions
                </p>
                <div className="mt-2 bg-blue-200 dark:bg-blue-800 h-2 rounded-full">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(revenueData.by_payment_method.card.total / revenueData.total_sales) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mobile Money</p>
                <p className="text-2xl font-bold">
                  GH₵{revenueData.by_payment_method.mobile_money.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {revenueData.by_payment_method.mobile_money.count} transactions
                </p>
                <div className="mt-2 bg-purple-200 dark:bg-purple-800 h-2 rounded-full">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(revenueData.by_payment_method.mobile_money.total / revenueData.total_sales) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Best Sellers */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Best Selling Products
            <Badge variant="secondary">{bestSellers.length}</Badge>
          </h2>

          {bestSellers.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No sales data available for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">SKU</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Qty Sold</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.slice(0, 10).map((product, index) => (
                    <tr key={product.product_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">#{index + 1}</span>
                          {index === 0 && <Badge variant="default" className="bg-yellow-600">Top</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{product.product_name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{product.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {product.quantity_sold}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        GH₵{product.total_revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Peak Hours */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sales by Hour
          </h2>

          {peakHours.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No hourly data available
            </div>
          ) : (
            <div className="space-y-2">
              {peakHours
                .filter(hour => hour.transactions > 0)
                .sort((a, b) => b.transactions - a.transactions)
                .slice(0, 12)
                .map((hour) => {
                  const maxTransactions = Math.max(...peakHours.map(h => h.transactions))
                  const percentage = (hour.transactions / maxTransactions) * 100

                  return (
                    <div key={hour.hour} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{hour.hour_label}</div>
                      <div className="flex-1">
                        <div className="bg-gray-200 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                          <div
                            className="bg-primary h-full flex items-center justify-between px-3 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-sm font-semibold">
                              {hour.transactions} sales
                            </span>
                            <span className="text-white text-sm">
                              GH₵{hour.total_sales.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
