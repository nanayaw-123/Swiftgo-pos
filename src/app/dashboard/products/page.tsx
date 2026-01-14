"use client"

import { SetStateAction, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Search, Loader2, AlertTriangle, Upload, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/useUserRole'
import Papa from 'papaparse'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  stock: number
  category: string
  supplier?: string | null
  expiry_date?: string | null
  low_stock_threshold?: number
  image_url: string | null
  tenant_id: string
  created_at: string
}

const categories = ['Electronics', 'Clothing', 'Food', 'Beverages', 'Furniture', 'Books', 'Toys', 'Sports', 'Health', 'Beauty', 'Medicines', 'Other']

export default function ProductsPage() {
  const { session, loading: authLoading } = useAuth()
    const { tenantId, loading: roleLoading } = useUserRole()
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    stock: '',
    category: '',
    supplier: '',
    expiry_date: '',
    low_stock_threshold: '10',
    image_url: '',
    store_id: ''
  })

  const getToken = async () => {
    return localStorage.getItem('bearer_token') || session?.access_token || ''
  }

  useEffect(() => {
    if (tenantId && session) {
      loadProducts()
      loadStores()
    }
  }, [tenantId, session])

  const loadStores = async () => {
    if (!tenantId) return
    
    try {
      const token = await getToken()
      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to load stores')
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const loadProducts = async () => {
    if (!tenantId) return
    
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to load products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        supplier: formData.supplier || null,
        expiry_date: formData.expiry_date || null,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        image_url: formData.image_url || null,
        store_id: formData.store_id || stores[0]?.id
      }

      const token = await getToken()
      
      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        })

        if (!response.ok) throw new Error('Failed to update product')
        toast.success('Product updated successfully')
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        })

        if (!response.ok) throw new Error('Failed to create product')
        toast.success('Product created successfully')
      }

      setDialogOpen(false)
      resetForm()
      await loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setCsvFile(file)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length === 0) {
          toast.error('CSV file is empty')
          return
        }
        setCsvData(results.data)
        toast.success(`Loaded ${results.data.length} products from CSV`)
      },
      error: (error: any) => {
        toast.error('Failed to parse CSV file')
        console.error(error)
      }
    })
  }

  const handleCsvImport = async () => {
    if (csvData.length === 0) {
      toast.error('No data to import')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      const token = await getToken()
      const total = csvData.length
      let success = 0
      let failed = 0

      for (let i = 0; i < total; i++) {
        const row = csvData[i]
        try {
          const productData = {
            name: row.name || row.Name || '',
            sku: row.sku || row.SKU || `SKU-${Date.now()}-${i}`,
            barcode: row.barcode || row.Barcode || null,
            price: parseFloat(row.price || row.Price || '0'),
            stock: parseInt(row.stock || row.Stock || '0'),
            category: row.category || row.Category || 'Other',
            supplier: row.supplier || row.Supplier || null,
            expiry_date: row.expiry_date || row.ExpiryDate || null,
            low_stock_threshold: parseInt(row.low_stock_threshold || row.LowStockThreshold || '10'),
            image_url: row.image_url || row.ImageURL || null,
            store_id: stores[0]?.id
          }

          const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
          })

          if (response.ok) {
            success++
          } else {
            failed++
          }
        } catch (error) {
          failed++
          console.error(`Error importing row ${i}:`, error)
        }

        setUploadProgress(Math.round(((i + 1) / total) * 100))
      }

      toast.success(`Import complete! ${success} products added, ${failed} failed`)
      setCsvDialogOpen(false)
      setCsvData([])
      setCsvFile(null)
      setUploadProgress(0)
      await loadProducts()
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Failed to import products')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCsvTemplate = () => {
    const template = `name,sku,barcode,price,stock,category,supplier,expiry_date,low_stock_threshold
Sample Product,SKU-001,1234567890,29.99,100,Electronics,ABC Suppliers,2025-12-31,10
Another Product,SKU-002,0987654321,15.50,50,Food,XYZ Suppliers,2024-06-30,5`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete product')
      toast.success('Product deleted successfully')
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      supplier: product.supplier || '',
      expiry_date: product.expiry_date || '',
      low_stock_threshold: product.low_stock_threshold?.toString() || '10',
      image_url: product.image_url || '',
      store_id: ''
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      price: '',
      stock: '',
      category: '',
      supplier: '',
      expiry_date: '',
      low_stock_threshold: '10',
      image_url: '',
      store_id: ''
    })
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.supplier && p.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const lowStockProducts = products.filter(p => p.stock < (p.low_stock_threshold || 10))

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
            <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your product catalog and inventory</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Products from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to bulk import products
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      disabled={submitting}
                    />
                  </div>
                  {csvData.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                      <p className="text-sm text-green-800 dark:text-green-400">
                        ✓ {csvData.length} products ready to import
                      </p>
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Importing... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={downloadCsvTemplate}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <Button 
                      onClick={handleCsvImport}
                      disabled={csvData.length === 0 || submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>Import {csvData.length} Products</>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={dialogOpen} onOpenChange={(open: boolean|((prevState: boolean) => boolean)) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update product details' : 'Create a new product in your inventory'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        required
                        placeholder="Enter product name"
                        value={formData.name}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        required
                        placeholder="e.g. PROD-001"
                        value={formData.sku}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        placeholder="Barcode number"
                        value={formData.barcode}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, barcode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Initial Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        required
                        placeholder="0"
                        value={formData.stock}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        placeholder="Supplier name"
                        value={formData.supplier}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, supplier: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, expiry_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="low_stock_threshold">Low Stock Alert Threshold</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        min="0"
                        placeholder="10"
                        value={formData.low_stock_threshold}
                        onChange={(e: { target: { value: any } }) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      />
                    </div>
                    {stores.length > 0 && (
                      <div>
                        <Label htmlFor="store_id">Store Location</Label>
                        <Select value={formData.store_id} onValueChange={(value: any) => setFormData({ ...formData, store_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select store" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e: { target: { value: any } }) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingProduct ? 'Update Product' : 'Create Product'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="p-3 sm:p-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-orange-900 dark:text-orange-400">Low Stock Alert</h3>
                <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300 mt-1">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Products</p>
            <p className="text-xl sm:text-2xl font-bold">{products.length}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Stock</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{products.filter(p => p.stock > (p.low_stock_threshold || 10)).length}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}</p>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search products by name, SKU, category, or supplier..."
              value={searchQuery}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-xs sm:text-sm">Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">Stock</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 sm:py-12">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500">Loading products...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 sm:py-12">
                      <p className="text-sm sm:text-base text-gray-500">No products found</p>
                      {searchQuery && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Try a different search term</p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-xs sm:text-base">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                          <span className="font-medium text-xs sm:text-sm line-clamp-2">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm hidden sm:table-cell">{product.sku}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">{product.category}</TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{product.stock}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={product.stock > (product.low_stock_threshold || 10) ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'} className="text-xs">
                          {product.stock > (product.low_stock_threshold || 10) ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              handleDelete(product.id)
                            }
                          }} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
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