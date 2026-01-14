"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, FileText, Truck, CheckCircle, Clock, X, Pencil, Trash2, Search, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  price: string
}

interface PurchaseOrderItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: string
  total: string
}

interface PurchaseOrder {
  id: number
  order_number: string
  supplier_id: number
  supplier_name?: string
  status: string
  items: PurchaseOrderItem[]
  total_amount: string
  expected_delivery_date: string | null
  received_date: string | null
  notes: string | null
  created_at: string
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    notes: ''
  })
  
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([])
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    quantity: '1',
    unit_price: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/purchase-orders', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/products', { headers })
      ])

      if (!ordersRes.ok || !suppliersRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [ordersData, suppliersData, productsData] = await Promise.all([
        ordersRes.json(),
        suppliersRes.json(),
        productsRes.json()
      ])

      // Map supplier names to orders
      const ordersWithSuppliers = (ordersData.purchase_orders || []).map((order: PurchaseOrder) => ({
        ...order,
        supplier_name: suppliersData.suppliers?.find((s: Supplier) => s.id === order.supplier_id)?.name
      }))

      setOrders(ordersWithSuppliers)
      setSuppliers(suppliersData.suppliers || [])
      setProducts(productsData.products || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load purchase orders')
    } finally {
      setIsLoading(false)
    }
  }

  const addItemToOrder = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.unit_price) {
      toast.error('Please fill in all item fields')
      return
    }

    const product = products.find(p => p.id === parseInt(currentItem.product_id))
    if (!product) return

    const quantity = parseInt(currentItem.quantity)
    const unit_price = parseFloat(currentItem.unit_price)
    const total = (quantity * unit_price).toFixed(2)

    const newItem: PurchaseOrderItem = {
      product_id: parseInt(currentItem.product_id),
      product_name: product.name,
      quantity,
      unit_price: currentItem.unit_price,
      total
    }

    setOrderItems([...orderItems, newItem])
    setCurrentItem({ product_id: '', quantity: '1', unit_price: '' })
  }

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order')
      return
    }

    if (!formData.supplier_id) {
      toast.error('Please select a supplier')
      return
    }

    try {
      const token = localStorage.getItem('bearer_token')
      const url = editingOrder 
        ? `/api/purchase-orders/${editingOrder.id}`
        : '/api/purchase-orders'
      
      const method = editingOrder ? 'PUT' : 'POST'

      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        items: orderItems,
        total_amount: calculateTotal(),
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save purchase order')

      toast.success(editingOrder ? 'Purchase order updated' : 'Purchase order created')
      
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving purchase order:', error)
      toast.error('Failed to save purchase order')
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Order status updated')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setEditingOrder(null)
    setFormData({
      supplier_id: '',
      expected_delivery_date: '',
      notes: ''
    })
    setOrderItems([])
    setCurrentItem({ product_id: '', quantity: '1', unit_price: '' })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700', icon: FileText },
      ordered: { label: 'Ordered', className: 'bg-blue-100 text-blue-700', icon: Clock },
      shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-700', icon: Truck },
      received: { label: 'Received', className: 'bg-green-100 text-green-700', icon: CheckCircle }
    }

    const config = variants[status] || variants.draft
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const orderStats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    received: orders.filter(o => o.status === 'received').length,
    totalValue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0).toFixed(2)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-muted-foreground mt-1">Manage inventory purchase orders from suppliers</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
                <DialogDescription>
                  {editingOrder ? 'Update purchase order details' : 'Create a new purchase order from a supplier'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Order Items</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="product">Product</Label>
                      <Select value={currentItem.product_id} onValueChange={(value) => setCurrentItem({ ...currentItem, product_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit_price">Unit Price</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentItem.unit_price}
                        onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={addItemToOrder} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>

                  {/* Items List */}
                  {orderItems.length > 0 && (
                    <div className="border-t pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₵{item.unit_price}</TableCell>
                              <TableCell>₵{item.total}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                            <TableCell className="font-bold">₵{calculateTotal()}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this order..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingOrder ? 'Update' : 'Create'} Order
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-bold mt-1">{orderStats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Draft</div>
            <div className="text-2xl font-bold mt-1">{orderStats.draft}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Ordered</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{orderStats.ordered}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Shipped</div>
            <div className="text-2xl font-bold mt-1 text-purple-600">{orderStats.shipped}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Received</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{orderStats.received}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold mt-1">₵{orderStats.totalValue}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading purchase orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No orders found matching your filters' 
                        : 'No purchase orders yet. Create your first order!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-medium">₵{order.total_amount}</TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-32">
                            {getStatusBadge(order.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date ? (
                          <div className="text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(order.expected_delivery_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/purchase-orders/${order.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
