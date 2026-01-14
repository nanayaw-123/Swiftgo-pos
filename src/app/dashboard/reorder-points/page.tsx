"use client"

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Bell, RefreshCw, CheckCircle, AlertTriangle, Search, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  stock_quantity: number
}

interface ReorderRule {
  id: number
  product_id: number
  product_name?: string
  product_sku?: string
  current_stock?: number
  reorder_point: number
  reorder_quantity: number
  preferred_supplier_id: number | null
  supplier_name?: string
  auto_generate_po: boolean
  is_active: boolean
  created_at: string
}

export default function ReorderPointsPage() {
  const [rules, setRules] = useState<ReorderRule[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null)
  
  const [formData, setFormData] = useState({
    product_id: '',
    reorder_point: '10',
    reorder_quantity: '50',
    preferred_supplier_id: '',
    auto_generate_po: false,
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('bearer_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [rulesRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/reorder-rules', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/products', { headers })
      ])

      if (!rulesRes.ok || !suppliersRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [rulesData, suppliersData, productsData] = await Promise.all([
        rulesRes.json(),
        suppliersRes.json(),
        productsRes.json()
      ])

      // Enrich rules with product and supplier info
      const enrichedRules = (rulesData.reorder_rules || []).map((rule: ReorderRule) => {
        const product = productsData.products?.find((p: Product) => p.id === rule.product_id)
        const supplier = suppliersData.suppliers?.find((s: Supplier) => s.id === rule.preferred_supplier_id)
        
        return {
          ...rule,
          product_name: product?.name,
          product_sku: product?.sku,
          current_stock: product?.stock_quantity,
          supplier_name: supplier?.name
        }
      })

      setRules(enrichedRules)
      setSuppliers(suppliersData.suppliers || [])
      setProducts(productsData.products || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load reorder rules')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id) {
      toast.error('Please select a product')
      return
    }

    try {
      const token = localStorage.getItem('bearer_token')
      const url = editingRule 
        ? `/api/reorder-rules/${editingRule.id}`
        : '/api/reorder-rules'
      
      const method = editingRule ? 'PUT' : 'POST'

      const payload = {
        product_id: parseInt(formData.product_id),
        reorder_point: parseInt(formData.reorder_point),
        reorder_quantity: parseInt(formData.reorder_quantity),
        preferred_supplier_id: formData.preferred_supplier_id ? parseInt(formData.preferred_supplier_id) : null,
        auto_generate_po: formData.auto_generate_po,
        is_active: formData.is_active
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save reorder rule')

      toast.success(editingRule ? 'Reorder rule updated' : 'Reorder rule created')
      
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving rule:', error)
      toast.error('Failed to save reorder rule')
    }
  }

  const handleEdit = (rule: ReorderRule) => {
    setEditingRule(rule)
    setFormData({
      product_id: rule.product_id.toString(),
      reorder_point: rule.reorder_point.toString(),
      reorder_quantity: rule.reorder_quantity.toString(),
      preferred_supplier_id: rule.preferred_supplier_id?.toString() || '',
      auto_generate_po: rule.auto_generate_po,
      is_active: rule.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reorder rule?')) return

    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/reorder-rules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete reorder rule')

      toast.success('Reorder rule deleted')
      fetchData()
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Failed to delete reorder rule')
    }
  }

  const toggleRuleStatus = async (ruleId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/reorder-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to toggle rule')

      toast.success(currentStatus ? 'Rule deactivated' : 'Rule activated')
      fetchData()
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast.error('Failed to toggle rule')
    }
  }

  const resetForm = () => {
    setEditingRule(null)
    setFormData({
      product_id: '',
      reorder_point: '10',
      reorder_quantity: '50',
      preferred_supplier_id: '',
      auto_generate_po: false,
      is_active: true
    })
  }

  const getStockStatus = (current: number, reorderPoint: number) => {
    if (current <= reorderPoint) return 'critical'
    if (current <= reorderPoint * 1.5) return 'warning'
    return 'good'
  }

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.product_sku?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && rule.is_active) ||
      (filterStatus === 'inactive' && !rule.is_active) ||
      (filterStatus === 'below_reorder' && rule.current_stock !== undefined && rule.current_stock <= rule.reorder_point)

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    belowReorder: rules.filter(r => r.current_stock !== undefined && r.current_stock <= r.reorder_point).length,
    autoGenerate: rules.filter(r => r.auto_generate_po).length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automated Reorder Points</h1>
            <p className="text-muted-foreground mt-1">Set up automatic purchase order triggers based on stock levels</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Reorder Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Reorder Rule' : 'Create Reorder Rule'}</DialogTitle>
                <DialogDescription>
                  {editingRule ? 'Update automatic reorder settings' : 'Set up automatic purchase order generation'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })} disabled={!!editingRule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.sku}) - Current Stock: {product.stock_quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reorder_point">Reorder Point *</Label>
                    <Input
                      id="reorder_point"
                      type="number"
                      min="0"
                      value={formData.reorder_point}
                      onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                      required
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Trigger reorder when stock falls to this level
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="reorder_quantity">Reorder Quantity *</Label>
                    <Input
                      id="reorder_quantity"
                      type="number"
                      min="1"
                      value={formData.reorder_quantity}
                      onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                      required
                      placeholder="e.g., 50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantity to order when reorder is triggered
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier">Preferred Supplier (Optional)</Label>
                  <Select value={formData.preferred_supplier_id} onValueChange={(value) => setFormData({ ...formData, preferred_supplier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No preference</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto_generate">Auto-Generate Purchase Orders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create draft POs when reorder point is reached
                      </p>
                    </div>
                    <Switch
                      id="auto_generate"
                      checked={formData.auto_generate_po}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_generate_po: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_active">Activate Rule</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable this reorder rule
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRule ? 'Update' : 'Create'} Rule
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
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-orange-200 bg-orange-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Below Reorder Point</p>
                <p className="text-2xl font-bold text-orange-600">{stats.belowReorder}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Generate PO</p>
                <p className="text-2xl font-bold">{stats.autoGenerate}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Banner */}
        {stats.belowReorder > 0 && (
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900">Reorder Alerts</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {stats.belowReorder} product{stats.belowReorder > 1 ? 's have' : ' has'} reached or fallen below the reorder point. 
                  Review and create purchase orders to replenish stock.
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
              <SelectItem value="all">All Rules</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
              <SelectItem value="below_reorder">Below Reorder Point</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rules Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Reorder Qty</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Auto PO</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading reorder rules...
                    </TableCell>
                  </TableRow>
                ) : filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'No rules found matching your filters' 
                        : 'No reorder rules yet. Create your first rule to automate inventory management!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => {
                    const stockStatus = rule.current_stock !== undefined ? getStockStatus(rule.current_stock, rule.reorder_point) : 'good'
                    
                    return (
                      <TableRow key={rule.id} className={stockStatus === 'critical' ? 'bg-orange-50/50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.product_name}</div>
                            <div className="text-sm text-muted-foreground">{rule.product_sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${stockStatus === 'critical' ? 'text-orange-600' : ''}`}>
                              {rule.current_stock}
                            </span>
                            {stockStatus === 'critical' && (
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rule.reorder_point}</TableCell>
                        <TableCell className="font-medium">{rule.reorder_quantity}</TableCell>
                        <TableCell>
                          {rule.supplier_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.auto_generate_po ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              <Bell className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleStatus(rule.id, rule.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(rule)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
