"use client"

import { useState, useEffect } from 'react'
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
import { Plus, ArrowRightLeft, CheckCircle, Clock, X, Search, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Store {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  stock_quantity: number
}

interface StockTransfer {
  id: number
  from_store_id: number | null
  to_store_id: number
  from_store_name?: string
  to_store_name?: string
  product_id: number
  product_name?: string
  quantity: number
  transfer_date: string
  status: string
  notes: string | null
  created_at: string
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    quantity: '1',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [transfersRes, storesRes, productsRes] = await Promise.all([
        fetch('/api/stock-transfers', { headers }),
        fetch('/api/stores', { headers }),
        fetch('/api/products', { headers })
      ])

      if (!transfersRes.ok || !storesRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [transfersData, storesData, productsData] = await Promise.all([
        transfersRes.json(),
        storesRes.json(),
        productsRes.json()
      ])

      // Map store and product names
      const enrichedTransfers = (transfersData.stock_transfers || []).map((transfer: StockTransfer) => ({
        ...transfer,
        from_store_name: storesData.stores?.find((s: Store) => s.id === transfer.from_store_id)?.name || 'Warehouse',
        to_store_name: storesData.stores?.find((s: Store) => s.id === transfer.to_store_id)?.name,
        product_name: productsData.products?.find((p: Product) => p.id === transfer.product_id)?.name
      }))

      setTransfers(enrichedTransfers)
      setStores(storesData.stores || [])
      setProducts(productsData.products || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load stock transfers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.to_store_id || !formData.product_id || !formData.quantity) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('bearer_token')

      const payload = {
        from_store_id: formData.from_store_id ? parseInt(formData.from_store_id) : null,
        to_store_id: parseInt(formData.to_store_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        transfer_date: formData.transfer_date,
        notes: formData.notes || null
      }

      const response = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to create stock transfer')

      toast.success('Stock transfer created successfully')
      
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error creating transfer:', error)
      toast.error('Failed to create stock transfer')
    }
  }

  const updateTransferStatus = async (transferId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/stock-transfers/${transferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Transfer status updated')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setFormData({
      from_store_id: '',
      to_store_id: '',
      product_id: '',
      quantity: '1',
      transfer_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      in_transit: { label: 'In Transit', className: 'bg-blue-100 text-blue-700', icon: ArrowRightLeft },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700', icon: X }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.from_store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.to_store_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const transferStats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    in_transit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stock Transfers</h1>
            <p className="text-muted-foreground mt-1">Transfer inventory between stores and warehouses</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
                <DialogDescription>
                  Transfer products between store locations
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_store">From Location</Label>
                    <Select value={formData.from_store_id} onValueChange={(value) => setFormData({ ...formData, from_store_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Warehouse (Main)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Warehouse (Main)</SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="to_store">To Location *</Label>
                    <Select value={formData.to_store_id} onValueChange={(value) => setFormData({ ...formData, to_store_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.sku}) - Stock: {product.stock_quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="transfer_date">Transfer Date *</Label>
                    <Input
                      id="transfer_date"
                      type="date"
                      value={formData.transfer_date}
                      onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this transfer..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Transfer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transfers</p>
                <p className="text-2xl font-bold">{transferStats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{transferStats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{transferStats.in_transit}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{transferStats.completed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product or store..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transfers Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Transfer Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading stock transfers...
                    </TableCell>
                  </TableRow>
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No transfers found matching your filters' 
                        : 'No stock transfers yet. Create your first transfer!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.product_name}</TableCell>
                      <TableCell>{transfer.from_store_name}</TableCell>
                      <TableCell>{transfer.to_store_name}</TableCell>
                      <TableCell className="font-medium">{transfer.quantity} units</TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={transfer.status} onValueChange={(value) => updateTransferStatus(transfer.id, value)}>
                          <SelectTrigger className="w-36">
                            {getStatusBadge(transfer.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.notes && (
                          <Button variant="ghost" size="sm" title={transfer.notes}>
                            View Notes
                          </Button>
                        )}
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
