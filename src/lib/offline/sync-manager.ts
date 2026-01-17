import {
  getUnsyncedSales,
  markSaleSynced,
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  saveProducts,
  saveCustomers,
  setSetting,
  getSetting,
  type OfflineSale,
  type OfflineProduct,
  type OfflineCustomer,
  type SyncQueueItem
} from './indexeddb'

// lib/offline/sync-manager.ts

import { createClient } from '@/lib/supabase/client'

const SYNC_QUEUE_KEY = 'pos_sync_queue'
const OFFLINE_SALES_KEY = 'pos_offline_sales'
const OFFLINE_PRODUCTS_KEY = 'pos_offline_products'

interface QueuedSale {
  id: string
  timestamp: number
  data: {
    store_id: string
    customer_id: string | null
    items: Array<{
      product_id: string
      name: string
      price: number
      quantity: number
      discount: number
    }>
    total: number
    payment_method: string
    is_credit: boolean
    amount_paid: number
    momo_network?: string | null
    momo_phone?: string | null
  }
  synced: boolean
  retryCount: number
}

interface SyncStatus {
  isSyncing: boolean
  lastSync: number | null
  pendingCount: number
  failedCount: number
}

export class SyncManager {
  private static supabase = createClient()
  private static isSyncing = false
  private static syncListeners: Array<(status: SyncStatus) => void> = []

  /**
   * Queue a sale for offline sync
   */
  static async queueSale(saleData: QueuedSale['data']): Promise<string> {
    const queue = this.getQueue()
    
    const queuedSale: QueuedSale = {
      id: this.generateId(),
      timestamp: Date.now(),
      data: saleData,
      synced: false,
      retryCount: 0
    }

    queue.push(queuedSale)
    this.saveQueue(queue)

    // Also save to offline sales for immediate access
    this.saveOfflineSale(queuedSale)

    // Notify listeners
    this.notifyListeners()

    return queuedSale.id
  }

  /**
   * Sync all pending sales to server
   */
  static async syncPendingSales(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress')
      return { success: 0, failed: 0 }
    }

    if (!navigator.onLine) {
      console.log('Cannot sync while offline')
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    this.notifyListeners()

    const queue = this.getQueue()
    const pendingSales = queue.filter(s => !s.synced)

    let successCount = 0
    let failedCount = 0

    for (const sale of pendingSales) {
      try {
        // Attempt to sync to server
        const response = await fetch('/api/pos/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale.data)
        })

        if (!response.ok) {
          throw new Error('Server error')
        }

        const result = await response.json()

        // Mark as synced
        sale.synced = true
        sale.data = { ...sale.data, id: result.sale_id } as any
        successCount++

        // Remove from offline sales
        this.removeOfflineSale(sale.id)

      } catch (error) {
        console.error('Failed to sync sale:', sale.id, error)
        sale.retryCount++
        failedCount++

        // Remove from queue if retry limit exceeded
        if (sale.retryCount >= 5) {
          console.error('Max retries exceeded for sale:', sale.id)
          this.archiveFailedSale(sale)
        }
      }
    }

    // Update queue (remove synced items)
    const updatedQueue = queue.filter(s => !s.synced && s.retryCount < 5)
    this.saveQueue(updatedQueue)

    this.isSyncing = false
    this.notifyListeners()

    return { success: successCount, failed: failedCount }
  }

  /**
   * Get sync queue from localStorage
   */
  private static getQueue(): QueuedSale[] {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading sync queue:', error)
      return []
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private static saveQueue(queue: QueuedSale[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Error saving sync queue:', error)
    }
  }

  /**
   * Save offline sale for immediate display
   */
  private static saveOfflineSale(sale: QueuedSale): void {
    if (typeof window === 'undefined') return
    
    try {
      const sales = this.getOfflineSales()
      sales.push({
        id: sale.id,
        created_at: new Date(sale.timestamp).toISOString(),
        total: sale.data.total,
        payment_method: sale.data.payment_method,
        items: sale.data.items,
        customer_id: sale.data.customer_id,
        is_synced: false
      })
      localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(sales))
    } catch (error) {
      console.error('Error saving offline sale:', error)
    }
  }

  /**
   * Get offline sales
   */
  static getOfflineSales(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(OFFLINE_SALES_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading offline sales:', error)
      return []
    }
  }

  /**
   * Remove offline sale after sync
   */
  private static removeOfflineSale(saleId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const sales = this.getOfflineSales()
      const filtered = sales.filter(s => s.id !== saleId)
      localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error removing offline sale:', error)
    }
  }

  /**
   * Archive failed sale for manual review
   */
  private static archiveFailedSale(sale: QueuedSale): void {
    if (typeof window === 'undefined') return
    
    try {
      const archived = JSON.parse(localStorage.getItem('pos_failed_sales') || '[]')
      archived.push({ ...sale, archivedAt: Date.now() })
      localStorage.setItem('pos_failed_sales', JSON.stringify(archived))
    } catch (error) {
      console.error('Error archiving failed sale:', error)
    }
  }

  /**
   * Cache products for offline use
   */
  static cacheProducts(products: any[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify({
        products,
        cachedAt: Date.now()
      }))
    } catch (error) {
      console.error('Error caching products:', error)
    }
  }

  /**
   * Get cached products
   */
  static getCachedProducts(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(OFFLINE_PRODUCTS_KEY)
      if (!data) return []
      
      const { products, cachedAt } = JSON.parse(data)
      
      // Cache expires after 24 hours
      if (Date.now() - cachedAt > 24 * 60 * 60 * 1000) {
        return []
      }
      
      return products
    } catch (error) {
      console.error('Error reading cached products:', error)
      return []
    }
  }

  /**
   * Update product stock locally after sale
   */
  static updateLocalStock(productId: string, quantitySold: number): void {
    if (typeof window === 'undefined') return
    
    try {
      const cached = localStorage.getItem(OFFLINE_PRODUCTS_KEY)
      if (!cached) return
      
      const data = JSON.parse(cached)
      const product = data.products.find((p: any) => p.id === productId)
      
      if (product) {
        product.stock = Math.max(0, product.stock - quantitySold)
        localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error updating local stock:', error)
    }
  }

  /**
   * Get current sync status
   */
  static getSyncStatus(): SyncStatus {
    const queue = this.getQueue()
    const pendingSales = queue.filter(s => !s.synced)
    const failedSales = queue.filter(s => s.retryCount >= 3)

    return {
      isSyncing: this.isSyncing,
      lastSync: this.getLastSyncTime(),
      pendingCount: pendingSales.length,
      failedCount: failedSales.length
    }
  }

  /**
   * Get last sync timestamp
   */
  private static getLastSyncTime(): number | null {
    if (typeof window === 'undefined') return null
    
    try {
      const timestamp = localStorage.getItem('pos_last_sync')
      return timestamp ? parseInt(timestamp) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Set last sync timestamp
   */
  private static setLastSyncTime(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('pos_last_sync', Date.now().toString())
    } catch (error) {
      console.error('Error setting last sync time:', error)
    }
  }

  /**
   * Subscribe to sync status changes
   */
  static subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners of status change
   */
  private static notifyListeners(): void {
    const status = this.getSyncStatus()
    this.syncListeners.forEach(listener => listener(status))
  }

  /**
   * Auto-sync when coming back online
   */
  static initAutoSync(): void {
    if (typeof window === 'undefined') return

    // Sync when coming online
    window.addEventListener('online', async () => {
      console.log('Back online - starting auto-sync')
      const result = await this.syncPendingSales()
      console.log('Auto-sync complete:', result)
      this.setLastSyncTime()
    })

    // Periodic sync every 5 minutes if online
    setInterval(async () => {
      if (navigator.onLine) {
        const status = this.getSyncStatus()
        if (status.pendingCount > 0) {
          console.log('Periodic sync starting...')
          await this.syncPendingSales()
          this.setLastSyncTime()
        }
      }
    }, 5 * 60 * 1000)

    // Initial sync on load if online
    if (navigator.onLine) {
      setTimeout(() => {
        this.syncPendingSales()
      }, 2000)
    }
  }

  /**
   * Clear all offline data (use with caution)
   */
  static clearOfflineData(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(SYNC_QUEUE_KEY)
      localStorage.removeItem(OFFLINE_SALES_KEY)
      localStorage.removeItem(OFFLINE_PRODUCTS_KEY)
      localStorage.removeItem('pos_failed_sales')
      localStorage.removeItem('pos_last_sync')
      this.notifyListeners()
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get pending sales count
   */
  static getPendingCount(): number {
    const queue = this.getQueue()
    return queue.filter(s => !s.synced).length
  }

  /**
   * Force sync now (manual trigger)
   */
  static async forceSyncNow(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }
    
    const result = await this.syncPendingSales()
    this.setLastSyncTime()
    return result
  }
}

// Initialize auto-sync on module load
if (typeof window !== 'undefined') {
  SyncManager.initAutoSync()
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  pendingSales: number
  pendingItems: number
  syncErrors: string[]
}

let syncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingSales: 0,
  pendingItems: 0,
  syncErrors: []
}

let syncListeners: ((status: SyncStatus) => void)[] = []

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus }
}
export function addSyncListener(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener)
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener)
  }
}

// sync-manager.ts
export default class SyncManager {
  // ...
}


function notifyListeners() {
  syncListeners.forEach(listener => listener({ ...syncStatus }))
}

function updateStatus(updates: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...updates }
  notifyListeners()
}

export function initSyncManager() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    updateStatus({ isOnline: true })
    triggerSync()
  })

  window.addEventListener('offline', () => {
    updateStatus({ isOnline: false })
  })

  getSetting<string>('lastSyncAt').then(lastSync => {
    if (lastSync) {
      updateStatus({ lastSyncAt: lastSync })
    }
  })

  updatePendingCounts()

  if (navigator.onLine) {
    setTimeout(triggerSync, 2000)
  }

  setInterval(updatePendingCounts, 30000)
}

async function updatePendingCounts() {
  try {
    const tenantId = await getSetting<string>('tenantId')
    if (!tenantId) return

    const unsyncedSales = await getUnsyncedSales(tenantId)
    const syncQueue = await getSyncQueue()

    updateStatus({
      pendingSales: unsyncedSales.length,
      pendingItems: syncQueue.length
    })
  } catch (error) {
    console.error('Error updating pending counts:', error)
  }
}

let syncTimeout: NodeJS.Timeout | null = null

export function triggerSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
  
  syncTimeout = setTimeout(performSync, 500)
}

async function performSync() {
  if (!navigator.onLine || syncStatus.isSyncing) return

  updateStatus({ isSyncing: true, syncErrors: [] })

  const errors: string[] = []

  try {
    const tenantId = await getSetting<string>('tenantId')
    if (!tenantId) {
      updateStatus({ isSyncing: false })
      return
    }

    await syncSales(tenantId, errors)
    await syncQueue(errors)
    await fetchLatestData(tenantId)

    const now = new Date().toISOString()
    await setSetting('lastSyncAt', now)
    
    updateStatus({
      isSyncing: false,
      lastSyncAt: now,
      syncErrors: errors
    })

    await updatePendingCounts()

  } catch (error) {
    console.error('Sync error:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown sync error')
    updateStatus({ isSyncing: false, syncErrors: errors })
  }
}

async function syncSales(tenantId: string, errors: string[]) {
  const unsyncedSales = await getUnsyncedSales(tenantId)

  for (const sale of unsyncedSales) {
    try {
      const response = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sale',
          data: convertSaleForServer(sale)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync sale')
      }

      const result = await response.json()
      await markSaleSynced(sale.offlineId, result.id)

    } catch (error) {
      console.error(`Failed to sync sale ${sale.offlineId}:`, error)
      errors.push(`Sale sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

async function syncQueue(errors: string[]) {
  const queueItems = await getSyncQueue()

  for (const item of queueItems) {
    if (item.attempts >= 5) {
      continue
    }

    try {
      const response = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.entityType,
          action: item.action,
          data: item.payload
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      await removeSyncQueueItem(item.id)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await updateSyncQueueItem(item.id, {
        attempts: item.attempts + 1,
        lastError: errorMessage
      })
      errors.push(`Queue item sync failed: ${errorMessage}`)
    }
  }
}

async function fetchLatestData(tenantId: string) {
  try {
    const [productsRes, customersRes] = await Promise.all([
      fetch(`/api/products?tenant_id=${tenantId}`),
      fetch(`/api/customers?tenant_id=${tenantId}`)
    ])

    if (productsRes.ok) {
      const productsData = await productsRes.json()
      const products: OfflineProduct[] = productsData.products?.map((p: Record<string, unknown>) => ({
        id: p.id,
        tenantId: p.tenant_id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: Number(p.price),
        cost: Number(p.cost),
        stock: Number(p.stock),
        lowStockThreshold: Number(p.low_stock_threshold),
        category: p.category,
        imageUrl: p.image_url,
        updatedAt: p.updated_at
      })) || []
      await saveProducts(products)
    }

    if (customersRes.ok) {
      const customersData = await customersRes.json()
      const customers: OfflineCustomer[] = customersData.customers?.map((c: Record<string, unknown>) => ({
        id: c.id,
        tenantId: c.tenant_id,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        email: c.email,
        totalOwed: 0,
        updatedAt: c.updated_at
      })) || []
      await saveCustomers(customers)
    }

  } catch (error) {
    console.error('Error fetching latest data:', error)
  }
}

function convertSaleForServer(sale: OfflineSale) {
  return {
    offline_id: sale.offlineId,
    tenant_id: sale.tenantId,
    store_id: sale.storeId,
    customer_id: sale.customerId,
    cashier_id: sale.cashierId,
    total: sale.total,
    cost_total: sale.costTotal,
    payment_method: sale.paymentMethod,
    payment_reference: sale.paymentReference,
    payment_phone: sale.paymentPhone,
    amount_paid: sale.amountPaid,
    is_credit: sale.isCredit,
    debt_due_date: sale.debtDueDate,
    status: sale.status,
    notes: sale.notes,
    is_offline: true,
    created_at: sale.createdAt,
    items: sale.items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      discount: item.discount,
      total: item.total
    }))
  }
}

export async function setTenantId(tenantId: string) {
  await setSetting('tenantId', tenantId)
}

export async function forceSync() {
  if (navigator.onLine) {
    await performSync()
  }
}
