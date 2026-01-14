"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Search, 
  UserPlus, 
  TrendingUp, 
  Award,
  ShoppingCart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Star,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  total_purchases: number
  total_spent: number
  loyalty_points: number
  segment: string
  last_purchase_date: string
  created_at: string
}

interface CustomerStats {
  total_customers: number
  active_customers: number
  vip_customers: number
  average_order_value: number
  total_revenue: number
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('all')

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      
      // Calculate stats from customer data
      const totalCustomers = data.length
      const activeCustomers = data.filter((c: Customer) => {
        const lastPurchase = new Date(c.last_purchase_date)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return lastPurchase >= thirtyDaysAgo
      }).length
      
      const vipCustomers = data.filter((c: Customer) => c.segment === 'vip').length
      const totalRevenue = data.reduce((sum: number, c: Customer) => sum + c.total_spent, 0)
      const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

      setStats({
        total_customers: totalCustomers,
        active_customers: activeCustomers,
        vip_customers: vipCustomers,
        average_order_value: averageOrderValue,
        total_revenue: totalRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getSegmentBadgeColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'regular': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'at_risk': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'new': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm)
    const matchesSegment = selectedSegment === 'all' || customer.segment === selectedSegment
    return matchesSearch && matchesSegment
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-2">Manage relationships and grow your business</p>
        </div>
        <Button onClick={() => router.push('/dashboard/customers/new')} size="lg">
          <UserPlus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.total_customers}</div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.active_customers}</div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">VIP Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.vip_customers}</div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₵{stats.average_order_value.toFixed(2)}</div>
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₵{stats.total_revenue.toFixed(2)}</div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Database</CardTitle>
          <CardDescription>Search and filter your customer base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedSegment} onValueChange={setSelectedSegment} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="regular">Regular</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="at_risk">At Risk</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedSegment !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by adding your first customer'}
              </p>
              <Button onClick={() => router.push('/dashboard/customers/new')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{customer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </CardDescription>
                  </div>
                  <Badge className={getSegmentBadgeColor(customer.segment)}>
                    {customer.segment.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                    <p className="text-2xl font-bold">{customer.total_purchases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">₵{customer.total_spent.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{customer.loyalty_points}</span>
                  <span className="text-muted-foreground">loyalty points</span>
                </div>

                <div className="space-y-2 text-sm">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {customer.address}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Last purchase: {new Date(customer.last_purchase_date).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
