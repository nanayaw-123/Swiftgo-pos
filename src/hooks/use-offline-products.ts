import { useEffect, useState } from "react"

type Product = {
  name: any
  sku: any
  image_url: any
  price: any
  id: string
  stock: number
}

export function useOfflineProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isOffline, setIsOffline] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    setLoading(false)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  // ✅ ADD THIS
  const updateLocalStock = (productId: string, quantity: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, stock: p.stock - quantity }
          : p
      )
    )
  }

  // ✅ RETURN IT
  return {
    products,
    isOffline,
    loading,
    updateLocalStock,
  }
}


