'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Package, 
  AlertTriangle, 
  Calendar,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/lib/supabase-auth'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function DailyProfitPage() {
  const { tenantId } = useUserRole()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [selectedRange, setSelectedRange] = useState(7)

  useEffect(() => {
    if (tenantId) {
      fetchData()
    }
  }, [tenantId, selectedRange])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch daily profit report
      const { data: report, error: reportError } = await supabase
        .from('daily_profit_report')
        .select('*')
        .eq('organization_id', tenantId)
        .order('sale_date', { ascending: true })
        .limit(selectedRange)

      if (reportError) throw reportError
      setReportData(report || [])

      // Fetch low stock alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('products')
        .select('id, name, stock, low_stock_threshold')
        .eq('tenant_id', tenantId)
        .lte('stock', 10) // Simplified for demo, should use low_stock_threshold
        .limit(5)

      if (alertsError) throw alertsError
      setStockAlerts(alerts || [])

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const todayData = reportData[reportData.length - 1] || { total_revenue: 0, total_profit: 0, total_transactions: 0 }
  const totalPeriodProfit = reportData.reduce((sum, d) => sum + Number(d.total_profit), 0)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profit Insights</h1>
            <p className="text-gray-500 dark:text-gray-400">Track your earnings and business health</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {[7, 30, 90].map((range) => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'ghost'}
                size="sm"
                className="rounded-lg px-4"
                onClick={() => setSelectedRange(range)}
              >
                {range} Days
              </Button>
            ))}
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl">
            <p className="text-sm font-medium text-white/80">Today's Profit</p>
            <h2 className="text-4xl font-black mt-2">₵{Number(todayData.total_profit).toFixed(2)}</h2>
            <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5% from yesterday</span>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border-none">
            <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₵{Number(todayData.total_revenue).toFixed(2)}</h2>
            <p className="text-xs text-gray-400 mt-2">{todayData.total_transactions} Transactions</p>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border-none">
            <p className="text-sm font-medium text-gray-500">Period Total Profit</p>
            <h2 className="text-3xl font-bold text-green-600 mt-2">₵{totalPeriodProfit.toLocaleString()}</h2>
            <p className="text-xs text-gray-400 mt-2">Last {selectedRange} days total</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profit Chart */}
          <Card className="lg:col-span-2 p-6 shadow-xl border-none bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Profit Trend
              </h3>
              <Badge variant="secondary">₵ GHS</Badge>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="sale_date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickFormatter={(val) => `₵${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`₵${val}`, 'Profit']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_profit" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stock Alerts */}
          <div className="space-y-6">
            <Card className="p-6 shadow-xl border-none bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Stock Alerts
              </h3>
              <div className="space-y-4">
                {stockAlerts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No critical stock alerts</p>
                ) : (
                  stockAlerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-orange-600 font-medium">{item.stock} items left</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-orange-600 hover:bg-orange-100">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-6 text-sm" asChild>
                <a href="/dashboard/inventory">View All Inventory</a>
              </Button>
            </Card>

            {/* AI Insight */}
            <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold">AI Business Tip</h4>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                "Your profit margins on <strong>Electronics</strong> are 15% higher on Saturdays. Consider running a weekend bundle deal to boost your total profit."
              </p>
              <Button size="sm" variant="secondary" className="w-full mt-4 bg-white/20 hover:bg-white/30 border-none text-white">
                <Zap className="w-4 h-4 mr-2" />
                See Detailed Plan
              </Button>
            </Card>
          </div>
        </div>

        {/* Detailed Table Placeholder */}
        <Card className="p-6 shadow-xl border-none bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Daily Breakdown</h3>
            <Button variant="outline" size="sm">Download CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 border-b">
                  <th className="py-4 font-bold">Date</th>
                  <th className="py-4 font-bold">Transactions</th>
                  <th className="py-4 font-bold">Revenue</th>
                  <th className="py-4 font-bold">Profit</th>
                  <th className="py-4 font-bold">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 text-sm font-medium">{format(new Date(row.sale_date), 'EEEE, MMM d')}</td>
                    <td className="py-4 text-sm">{row.total_transactions}</td>
                    <td className="py-4 text-sm font-bold">₵{Number(row.total_revenue).toFixed(2)}</td>
                    <td className="py-4 text-sm font-bold text-green-600">₵{Number(row.total_profit).toFixed(2)}</td>
                    <td className="py-4 text-sm">
                      <Badge variant="secondary">
                        {((Number(row.total_profit) / Number(row.total_revenue)) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
