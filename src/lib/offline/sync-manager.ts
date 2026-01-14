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
