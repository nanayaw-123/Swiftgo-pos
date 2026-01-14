"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Star,
  TrendingUp,
  Award,
  Gift,
  Edit,
  Trash2
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

interface Purchase {
  id: string
  date: string
  items: Array<{name: string; quantity: number; price: number}>
  total: number
  payment_method: string
  store_name: string
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerDetails()
    fetchPurchaseHistory()
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch customer')
      
      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Failed to load customer details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch(`/api/customer-purchases?customer_id=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch purchases')
      
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Failed to load purchase history')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete customer')
      
      toast.success('Customer deleted successfully')
      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-6">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/customers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  const averagePurchaseValue = customer.total_purchases > 0 
    ? customer.total_spent / customer.total_purchases 
    : 0

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{customer.name}</h1>
            <Badge className={`${getSegmentBadgeColor(customer.segment)} mt-2`}>
              {customer.segment.toUpperCase()} CUSTOMER
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{customer.address}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{customer.total_purchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₵{customer.total_spent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Purchase Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₵{averagePurchaseValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Loyalty Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{customer.loyalty_points}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="purchases" className="space-y-6">
        <TabsList>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty & Rewards</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>All transactions from this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No purchases yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold text-lg">₵{purchase.total.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(purchase.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">{purchase.payment_method}</Badge>
                        </div>
                        <div className="space-y-2">
                          {purchase.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-medium">₵{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Points</CardTitle>
              <CardDescription>Manage customer rewards and loyalty benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-4xl font-bold text-yellow-600">{customer.loyalty_points}</p>
                  <p className="text-sm text-muted-foreground mt-1">points available</p>
                </div>
                <Award className="w-20 h-20 text-yellow-600 opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <Gift className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Reward Eligibility</h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.loyalty_points >= 1000 
                        ? 'Eligible for ₵10 discount' 
                        : `Need ${1000 - customer.loyalty_points} more points for next reward`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <Star className="w-8 h-8 text-yellow-500 mb-3" />
                    <h3 className="font-semibold mb-2">Member Since</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>AI-powered analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Purchase Pattern
                </h3>
                <p className="text-sm text-muted-foreground">
                  Last purchase was {Math.floor((new Date().getTime() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))} days ago.
                  {Math.floor((new Date().getTime() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)) > 30 
                    ? ' Customer may be at risk of churning.' 
                    : ' Customer is actively engaged.'}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Customer Segment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Classified as <strong>{customer.segment.toUpperCase()}</strong> based on purchase frequency and spending patterns.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
