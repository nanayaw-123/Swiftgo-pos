'use client'

import { useState, useEffect, useRef, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone, Wifi, WifiOff, Receipt, ShoppingCart, Camera, Percent, Save, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { SyncManager } from '@/lib/offline/sync-manager'

const supabase = createClient()

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  stock: number
  image_url: string | null
  category: string | null
}

interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  stock: number
  discount: number
}

interface Store {
  id: string
  name: string
}

export default function POSPage() {
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()
  
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true)
  const [loading, setLoading] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customers, setCustomers] = useState<any[]>([])
  const [momoNetwork, setMomoNetwork] = useState<'mtn' | 'telecel' | 'at'>('mtn')
  const [momoPhone, setMomoPhone] = useState('')

  // Camera scanning
  const [showScanner, setShowScanner] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadStores()
      loadProducts()
      loadCustomers()
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router, authLoading, user])

  const loadStores = async () => {
    const { data } = await supabase.from('stores').select('id, name')
    if (data) {
      setStores(data)
      if (data.length > 0) setSelectedStore(data[0].id)
    }
  }

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*')
    if (data) setProducts(data)
  }

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) setCustomers(data)
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product_id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Out of stock')
        return
      }
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock,
        discount: 0
      }])
    }
  }

  const updateQuantity = (id: string, q: number) => {
    if (q < 1) {
      setCart(cart.filter(i => i.product_id !== id))
      return
    }
    setCart(cart.map(i => i.product_id === id ? { ...i, quantity: q } : i))
  }

  const getTotal = () => cart.reduce((s, i) => s + (i.price * i.quantity), 0)

  const handleCheckout = async (method: 'cash' | 'momo' | 'credit' | 'card') => {
    if (cart.length === 0) return toast.error('Cart is empty')
    if (method === 'credit' && !selectedCustomer) return toast.error('Select customer for credit')
    if (method === 'momo' && (!momoPhone || momoPhone.length < 10)) return toast.error('Enter valid MoMo number')

    setLoading(true)
    const total = getTotal()
    const saleData = {
      store_id: selectedStore,
      customer_id: selectedCustomer || null,
      items: cart,
      total,
      payment_method: method,
      is_credit: method === 'credit',
      amount_paid: method === 'credit' ? 0 : total,
      momo_network: method === 'momo' ? momoNetwork : null,
      momo_phone: method === 'momo' ? momoPhone : null
    }

    try {
      if (isOnline) {
        const res = await fetch('/api/pos/checkout', {
          method: 'POST',
          body: JSON.stringify(saleData)
        })
        if (!res.ok) throw new Error('Checkout failed')
        const result = await res.json()
        setLastSale({ ...saleData, id: result.sale_id, created_at: new Date().toISOString() })
      } else {
        // Offline logic
        await SyncManager.queueSale(saleData)
        toast.success('Sale saved offline. Will sync when online.')
      }

      toast.success('Sale completed!')
      setCart([])
      setShowReceipt(true)
      loadProducts()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left: Products */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setShowScanner(true)}><Camera className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <Card key={p.id} className="p-4 cursor-pointer hover:border-primary transition-all" onClick={() => addToCart(p)}>
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-2xl">
                  {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-lg" /> : '📦'}
                </div>
                <h3 className="font-bold truncate">{p.name}</h3>
                <p className="text-primary font-bold">GHS {p.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="space-y-4">
          <Card className="p-4 flex flex-col h-[calc(100vh-120px)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Cart ({cart.length})
              </h2>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="flex-1 overflow-auto space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">GHS {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="font-bold">{item.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer
                </label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger><SelectValue placeholder="Walk-in Customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-primary">GHS {getTotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button className="h-14 font-bold" onClick={() => handleCheckout('cash')} disabled={loading}><DollarSign className="w-4 h-4 mr-2" /> Cash</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-14 font-bold" variant="outline" disabled={loading}><Smartphone className="w-4 h-4 mr-2" /> MoMo</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Mobile Money Payment</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-3 gap-2">
                        {(['mtn', 'telecel', 'at'] as const).map(n => (
                          <Button key={n} variant={momoNetwork === n ? 'default' : 'outline'} onClick={() => setMomoNetwork(n)} className="capitalize">{n}</Button>
                        ))}
                      </div>
                      <Input placeholder="MoMo Phone Number" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} />
                      <Button className="w-full h-12" onClick={() => handleCheckout('momo')}>Confirm GHS {getTotal().toFixed(2)}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button className="h-14 font-bold" variant="outline" onClick={() => handleCheckout('credit')} disabled={loading}><CreditCard className="w-4 h-4 mr-2" /> Credit</Button>
                <Button className="h-14 font-bold" variant="outline" onClick={() => handleCheckout('card')} disabled={loading}><CreditCard className="w-4 h-4 mr-2" /> Card</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm">
          <div className="text-center space-y-2 py-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Sale Successful</h2>
            <p className="text-muted-foreground">Transaction ID: {lastSale?.id?.slice(0,8)}</p>
            <div className="border-t border-dashed my-4 pt-4 text-left space-y-2">
              <div className="flex justify-between font-bold"><span>Total Paid:</span><span>GHS {lastSale?.total?.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Method:</span><span className="capitalize">{lastSale?.payment_method}</span></div>
            </div>
            <Button className="w-full" onClick={() => window.print()}>Print Receipt</Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowReceipt(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { DialogTrigger } from '@/components/ui/dialog'
