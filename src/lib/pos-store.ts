import { create } from 'zustand'

interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  stock: number
}

interface POSStore {
  cart: CartItem[]
  addToCart: (product: CartItem) => void
  removeFromCart: (product_id: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  
  addToCart: (product) => {
    const cart = get().cart
    const existingItem = cart.find(item => item.product_id === product.product_id)
    
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        )
      })
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] })
    }
  },
  
  removeFromCart: (product_id) => {
    set({ cart: get().cart.filter(item => item.product_id !== product_id) })
  },
  
  updateQuantity: (product_id, quantity) => {
    set({
      cart: get().cart.map(item =>
        item.product_id === product_id
          ? { ...item, quantity: Math.min(Math.max(0, quantity), item.stock) }
          : item
      ).filter(item => item.quantity > 0)
    })
  },
  
  clearCart: () => set({ cart: [] }),
  
  getTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
}))
