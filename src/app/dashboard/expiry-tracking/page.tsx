"use client"

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Calendar, Search, Package, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  sku: string
  stock_quantity: number
  expiry_date: string | null
  category: string
  batch_number?: string
}

export default function ExpiryTrackingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      const productsWithExpiry = (data.products || []).filter((p: Product) => p.expiry_date)
      setProducts(productsWithExpiry)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'none'
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'expired'
    if (diffDays <= 7) return 'critical'
    if (diffDays <= 30) return 'warning'
    return 'good'
  }

  const getStatusBadge = (status: string, daysUntilExpiry: number) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      expired: { label: `Expired ${Math.abs(daysUntilExpiry)} days ago`, className: 'bg-red-100 text-red-700', icon: XCircle },
      critical: { label: `${daysUntilExpiry} days left`, className: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      warning: { label: `${daysUntilExpiry} days left`, className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
      good: { label: `${daysUntilExpiry} days left`, className: 'bg-green-100 text-green-700', icon: CheckCircle }
    }

    const config = variants[status] || variants.good
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    
    const status = product.expiry_date ? getExpiryStatus(product.expiry_date) : 'none'
    const matchesFilter = filterStatus === 'all' || status === filterStatus

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: products.length,
    expired: products.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date) === 'expired').length,
    critical: products.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date) === 'critical').length,
    warning: products.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date) === 'warning').length,
    good: products.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date) === 'good').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expiry Tracking Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor product expiration dates and prevent waste</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-orange-200 bg-orange-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical (≤7 days)</p>
                <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-yellow-200 bg-yellow-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warning (≤30 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-200 bg-green-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                  <p className="text-sm text-muted-foreground">Good (&gt;30 days)</p>
                <p className="text-2xl font-bold text-green-600">{stats.good}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Banner */}
        {(stats.expired > 0 || stats.critical > 0) && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Immediate Action Required</h3>
                <p className="text-sm text-red-700 mt-1">
                  {stats.expired > 0 && `${stats.expired} product${stats.expired > 1 ? 's have' : ' has'} expired. `}
                  {stats.critical > 0 && `${stats.critical} product${stats.critical > 1 ? 's expire' : ' expires'} within 7 days.`}
                  {' '}Remove expired items and plan sales promotions for critical items.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="critical">Critical (≤7 days)</SelectItem>
              <SelectItem value="warning">Warning (≤30 days)</SelectItem>
                <SelectItem value="good">Good (&gt;30 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Qty</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'No products found matching your filters' 
                        : 'No products with expiry dates tracked yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const expiryStatus = product.expiry_date ? getExpiryStatus(product.expiry_date) : 'none'
                    const daysUntilExpiry = product.expiry_date ? getDaysUntilExpiry(product.expiry_date) : 0
                    
                    return (
                      <TableRow key={product.id} className={expiryStatus === 'expired' ? 'bg-red-50/50' : expiryStatus === 'critical' ? 'bg-orange-50/50' : ''}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell><Badge variant="outline">{product.sku}</Badge></TableCell>
                        <TableCell>{product.category || '—'}</TableCell>
                        <TableCell>{product.stock_quantity} units</TableCell>
                        <TableCell>
                          {product.expiry_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(product.expiry_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.expiry_date && getStatusBadge(expiryStatus, daysUntilExpiry)}
                        </TableCell>
                        <TableCell className="text-right">
                          {expiryStatus === 'expired' || expiryStatus === 'critical' ? (
                            <Button variant="destructive" size="sm">
                              Take Action
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
