"use client"

import { SetStateAction, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import { Loader2, Search, Download, Eye, Calendar, TrendingUp, DollarSign, ShoppingCart, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/hooks/use-auth'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface Sale {
  id: number
  total: number
  subtotal: number
  tax: number
  discount: number
  payment_method: string
  items: any[]
  created_at: string
  cashier_id: string
  store_id: number
}

interface SaleDetail {
  sale: Sale
  items: any[]
}

export default function SalesPage() {
    const { tenantId, loading: roleLoading } = useUserRole()
  const { session, loading: authLoading } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    averageSale: 0,
    totalItems: 0
  })
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([])
  const [dailySalesData, setDailySalesData] = useState<any[]>([])

  const getToken = async () => {
    return localStorage.getItem('bearer_token') || session?.access_token || ''
  }

  useEffect(() => {
    if (tenantId && session) {
      loadSales()
    }
  }, [tenantId, dateFilter, paymentFilter, session])

  const loadSales = async () => {
    if (!tenantId) return
    
    try {
      setLoading(true)
      
      let url = '/api/sales?'
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
        }
        
        url += `startDate=${startDate.toISOString()}&endDate=${now.toISOString()}&`
      }
      
      const token = await getToken()
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load sales')
      
      const data = await response.json()
      let salesData = data.sales || []
      
      // Apply payment method filter client-side
      if (paymentFilter !== 'all') {
        salesData = salesData.filter((s: Sale) => s.payment_method === paymentFilter)
      }
      
      setSales(salesData)
      calculateStats(salesData)
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalItems = salesData.reduce((sum, sale) => sum + (sale.items?.length || 0), 0)
    const averageSale = salesData.length ? totalRevenue / salesData.length : 0
    
    setStats({
      totalRevenue,
      totalSales: salesData.length,
      averageSale,
      totalItems
    })
    
    // Payment method breakdown
    const paymentMethods = salesData.reduce((acc: any, sale) => {
      const method = sale.payment_method || 'cash'
      acc[method] = (acc[method] || 0) + Number(sale.total)
      return acc
    }, {})
    
    const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(value)
    }))
    setPaymentMethodData(paymentData)
    
    // Daily sales data (last 7 days)
    const dailyMap: { [key: string]: number } = {}
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return format(date, 'MMM dd')
    })
    
    last7Days.forEach(day => { dailyMap[day] = 0 })
    
    salesData.forEach(sale => {
      const day = format(new Date(sale.created_at), 'MMM dd')
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += Number(sale.total)
      }
    })
    
    setDailySalesData(Object.entries(dailyMap).map(([name, total]) => ({ name, total })))
  }

  const viewSaleDetails = async (sale: Sale) => {
    setSelectedSale({ sale, items: sale.items || [] })
    setDetailsOpen(true)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Sale ID', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method']
    const rows = sales.map(sale => [
      format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
      sale.id,
      sale.items?.length || 0,
      sale.subtotal?.toFixed(2) || '0.00',
      sale.tax?.toFixed(2) || '0.00',
      sale.discount?.toFixed(2) || '0.00',
      sale.total.toFixed(2),
      sale.payment_method
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Sales report exported')
  }

  const filteredSales = sales.filter(sale => 
    sale.id.toString().includes(searchQuery) ||
    sale.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sales Reports</h1>
            <p className="text-sm sm:text-base text-gray-600">View and analyze your sales data</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalSales}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Average Sale</p>
                <p className="text-lg sm:text-2xl font-bold">${stats.averageSale.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Items Sold</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Daily Sales Chart */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Daily Sales (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="total" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Payment Methods Chart */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Revenue by Payment Method</h2>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
                No sales data available
              </div>
            )}
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search by sale ID or payment method..."
                value={searchQuery}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Sales Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Sale ID</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date & Time</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Subtotal</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Tax</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Discount</TableHead>
                  <TableHead className="text-xs sm:text-sm">Total</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Payment</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 sm:py-12">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500">Loading sales...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 sm:py-12">
                      <p className="text-sm sm:text-base text-gray-500">No sales found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">#{sale.id}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                        {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">{sale.items?.length || 0} items</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">${(sale.subtotal || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">${(sale.tax || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-red-600 text-xs sm:text-sm hidden xl:table-cell">-${(sale.discount || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-xs sm:text-sm">${Number(sale.total).toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize text-xs">
                          {sale.payment_method?.replace('_', ' ') || 'cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => viewSaleDetails(sale)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Sale Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sale Details #{selectedSale?.sale.id}</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Date</p>
                    <p className="font-medium text-sm sm:text-base">{format(new Date(selectedSale.sale.created_at), 'MMMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Payment Method</p>
                    <p className="font-medium capitalize text-sm sm:text-base">{selectedSale.sale.payment_method?.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Item</TableHead>
                        <TableHead className="text-xs sm:text-sm">Qty</TableHead>
                        <TableHead className="text-xs sm:text-sm">Price</TableHead>
                        <TableHead className="text-xs sm:text-sm">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs sm:text-sm">{item.name || item.product_name || `Product #${item.product_id}`}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-xs sm:text-sm">${Number(item.price || item.unit_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">${(Number(item.quantity) * Number(item.price || item.unit_price || 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="border-t pt-4 space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${(selectedSale.sale.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${(selectedSale.sale.tax || 0).toFixed(2)}</span>
                  </div>
                  {selectedSale.sale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-${selectedSale.sale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>${Number(selectedSale.sale.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}