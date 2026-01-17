// hooks/use-sync.ts


import { SyncManager } from '@/lib/offline/sync-manager'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useOfflineProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    loadProducts()

    const handleOnline = () => {
      setIsOffline(false)
      loadProducts() // Refresh from server
    }

    const handleOffline = () => {
      setIsOffline(true)
      loadCachedProducts() // Load from cache
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    
    try {
      if (navigator.onLine) {
        // Load from server
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name')

        if (error) throw error

        if (data) {
          setProducts(data)
          // Cache for offline use
          SyncManager.cacheProducts(data)
        }
      } else {
        // Load from cache
        loadCachedProducts()
      }
    } catch (error) {
      console.error('Error loading products:', error)
      loadCachedProducts() // Fallback to cache
    } finally {
      setLoading(false)
    }
  }

  const loadCachedProducts = () => {
    const cached = SyncManager.getCachedProducts()
    setProducts(cached)
    setLoading(false)
  }

  const updateLocalStock = (productId: string, quantity: number) => {
    SyncManager.updateLocalStock(productId, quantity)
    // Update local state
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, stock: Math.max(0, p.stock - quantity) }
          : p
      )
    )
  }

  return {
    products,
    loading,
    isOffline,
    updateLocalStock,
    refresh: loadProducts
  }
}

interface SyncStatus {
  isSyncing: boolean
  lastSync: number | null
  pendingCount: number
  failedCount: number
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    failedCount: 0
  })
  useEffect(() => {
    // Initial status
    setStatus(SyncManager.getSyncStatus())

    // Subscribe to changes
    const unsubscribe = SyncManager.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    return () => unsubscribe()
  }, [])

  const syncNow = async () => {
    try {
      const result = await SyncManager.forceSyncNow()
      
      if (result.success > 0) {
        toast.success(`${result.success} sale(s) synced successfully`)
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} sale(s) failed to sync`)
      }
      
      return result
    } catch (error: any) {
      toast.error(error.message || 'Sync failed')
      throw error
    }
  }

  const clearData = () => {
    SyncManager.clearOfflineData()
    toast.success('Offline data cleared')
  }

  return {
    status,
    syncNow,
    clearData,
    hasPending: status.pendingCount > 0,
    isSyncing: status.isSyncing
  }
}
interface SyncStatus {
  isSyncing: boolean
  lastSync: number | null
  pendingCount: number
  failedCount: number
}



