'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useOfflineProducts } from '@/hooks/use-offline-products'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Plus, Minus, DollarSign, Smartphone, Wifi, WifiOff, Receipt, ShoppingCart, Camera, CreditCard, User } from 'lucide-react'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { SyncManager } from '@/lib/offline/sync-manager'
import { SyncStatus } from '@/components/sync-status'
import SyncIndicatorBadge from '@/components/sync-indicator-badge'

const supabase = createClient()

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
  
  // Use offline-capable products hook
  const { products = [], loading: productsLoading, isOffline, updateLocalStock } = useOfflineProducts()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true)
  const [loading, setLoading] = useState(false)
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

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) setCustomers(data)
  }

  const addToCart = (product: any) => {
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
    toast.success(`${product.name} added to cart`)
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
    if (!selectedStore) return toast.error('Please select a store')
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
        // Online checkout
        const res = await fetch('/api/pos/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Checkout failed')
        }
        
        const result = await res.json()
        setLastSale({ ...saleData, id: result.sale_id, created_at: new Date().toISOString() })
        toast.success('Sale completed!')
      } else {
        // Offline checkout - queue for sync
        const saleId = await SyncManager.queueSale(saleData)
        setLastSale({ ...saleData, id: saleId, created_at: new Date().toISOString() })
        toast.success('Sale saved offline. Will sync when online.')
      }

      // Update local stock
      cart.forEach(item => {
        updateLocalStock(item.product_id, item.quantity)
      })

      // Clear cart and show receipt
      setCart([])
      setSelectedCustomer('')
      setMomoPhone('')
      setShowReceipt(true)
      
    } catch (e: any) {
      console.error('Checkout error:', e)
      toast.error(e.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      {/* Sync Status Banner */}
      <div className="max-w-7xl mx-auto mb-4">
        <SyncStatus />
      </div>

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
            <Button variant="outline" onClick={() => setShowScanner(true)}>
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <Card 
                  key={p.id} 
                  className="p-4 cursor-pointer hover:border-primary transition-all" 
                  onClick={() => addToCart(p)}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-2xl">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <h3 className="font-bold truncate">{p.name}</h3>
                  <p className="text-primary font-bold">GHS {p.price?.toFixed(2)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                    {isOffline && (
                      <Badge variant="outline" className="text-xs">
                        Cached
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!productsLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="space-y-4">
          <Card className="p-4 flex flex-col h-[calc(100vh-120px)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Cart ({cart.length})
              </h2>
              <SyncIndicatorBadge />
            </div>

            <div className="flex-1 overflow-auto space-y-3 mb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">GHS {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-bold min-w-[2ch] text-center">{item.quantity}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer (Optional)
                </label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in Customer</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-primary">GHS {getTotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="h-14 font-bold" 
                  onClick={() => handleCheckout('cash')} 
                  disabled={loading || cart.length === 0}
                >
                  <DollarSign className="w-4 h-4 mr-2" /> Cash
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="h-14 font-bold" 
                      variant="outline" 
                      disabled={loading || cart.length === 0}
                    >
                      <Smartphone className="w-4 h-4 mr-2" /> MoMo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mobile Money Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-3 gap-2">
                        {(['mtn', 'telecel', 'at'] as const).map(n => (
                          <Button 
                            key={n} 
                            variant={momoNetwork === n ? 'default' : 'outline'} 
                            onClick={() => setMomoNetwork(n)} 
                            className="capitalize"
                          >
                            {n.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                      <Input 
                        placeholder="MoMo Phone Number" 
                        value={momoPhone} 
                        onChange={e => setMomoPhone(e.target.value)}
                        maxLength={10}
                      />
                      <Button 
                        className="w-full h-12" 
                        onClick={() => {
                          handleCheckout('momo')
                        }}
                        disabled={!momoPhone || momoPhone.length < 10}
                      >
                        Confirm GHS {getTotal().toFixed(2)}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  className="h-14 font-bold" 
                  variant="outline" 
                  onClick={() => handleCheckout('credit')} 
                  disabled={loading || cart.length === 0}
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Credit
                </Button>
                
                <Button 
                  className="h-14 font-bold" 
                  variant="outline" 
                  onClick={() => handleCheckout('card')} 
                  disabled={loading || cart.length === 0}
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Card
                </Button>
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
            <p className="text-muted-foreground">
              Transaction ID: {lastSale?.id?.slice(0, 12)}
            </p>
            {!isOnline && (
              <Badge variant="outline" className="mt-2 border-amber-500 text-amber-600">
                Saved offline - will sync when online
              </Badge>
            )}
            <div className="border-t border-dashed my-4 pt-4 text-left space-y-2">
              <div className="flex justify-between font-bold">
                <span>Total Paid:</span>
                <span>GHS {lastSale?.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Method:</span>
                <span className="capitalize">{lastSale?.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Date:</span>
                <span>{lastSale?.created_at ? new Date(lastSale.created_at).toLocaleString() : ''}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => window.print()}>
              Print Receipt
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}