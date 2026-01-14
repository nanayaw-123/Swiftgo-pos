const DB_NAME = 'swiftpos_offline'
const DB_VERSION = 1

export interface OfflineSale {
  id: string
  offlineId: string
  tenantId: string
  storeId: string
  customerId?: string
  cashierId?: string
  items: SaleItem[]
  total: number
  costTotal: number
  paymentMethod: 'cash' | 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'bank' | 'card' | 'qr' | 'credit'
  paymentReference?: string
  paymentPhone?: string
  amountPaid: number
  isCredit: boolean
  debtDueDate?: string
  status: 'pending' | 'completed'
  notes?: string
  createdAt: string
  synced: boolean
  syncedAt?: string
  syncError?: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  costPrice: number
  discount: number
  total: number
}

export interface OfflineProduct {
  id: string
  tenantId: string
  name: string
  sku: string
  barcode?: string
  price: number
  cost: number
  stock: number
  lowStockThreshold: number
  category: string
  imageUrl?: string
  updatedAt: string
}

export interface OfflineCustomer {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  totalOwed: number
  updatedAt: string
}

export interface SyncQueueItem {
  id: string
  entityType: 'sale' | 'product' | 'customer' | 'debt_payment'
  entityId: string
  action: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  createdAt: string
  attempts: number
  lastError?: string
}

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains('sales')) {
        const salesStore = database.createObjectStore('sales', { keyPath: 'offlineId' })
        salesStore.createIndex('tenantId', 'tenantId', { unique: false })
        salesStore.createIndex('synced', 'synced', { unique: false })
        salesStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!database.objectStoreNames.contains('products')) {
        const productsStore = database.createObjectStore('products', { keyPath: 'id' })
        productsStore.createIndex('tenantId', 'tenantId', { unique: false })
        productsStore.createIndex('barcode', 'barcode', { unique: false })
        productsStore.createIndex('sku', 'sku', { unique: false })
      }

      if (!database.objectStoreNames.contains('customers')) {
        const customersStore = database.createObjectStore('customers', { keyPath: 'id' })
        customersStore.createIndex('tenantId', 'tenantId', { unique: false })
        customersStore.createIndex('phone', 'phone', { unique: false })
      }

      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' })
        syncStore.createIndex('entityType', 'entityType', { unique: false })
        syncStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' })
      }
    }
  })
}

export async function saveSale(sale: OfflineSale): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sales', 'readwrite')
    const store = tx.objectStore('sales')
    const request = store.put(sale)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getUnsyncedSales(tenantId: string): Promise<OfflineSale[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sales', 'readonly')
    const store = tx.objectStore('sales')
    const index = store.index('synced')
    const request = index.getAll(IDBKeyRange.only(false))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const sales = (request.result as OfflineSale[]).filter(s => s.tenantId === tenantId)
      resolve(sales)
    }
  })
}

export async function markSaleSynced(offlineId: string, serverId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sales', 'readwrite')
    const store = tx.objectStore('sales')
    const getRequest = store.get(offlineId)
    
    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const sale = getRequest.result as OfflineSale
      if (sale) {
        sale.id = serverId
        sale.synced = true
        sale.syncedAt = new Date().toISOString()
        const putRequest = store.put(sale)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
  })
}

export async function getSalesByDate(tenantId: string, date: string): Promise<OfflineSale[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sales', 'readonly')
    const store = tx.objectStore('sales')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const sales = (request.result as OfflineSale[]).filter(s => {
        const saleDate = s.createdAt.split('T')[0]
        return s.tenantId === tenantId && saleDate === date
      })
      resolve(sales)
    }
  })
}

export async function saveProducts(products: OfflineProduct[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('products', 'readwrite')
    const store = tx.objectStore('products')
    
    products.forEach(product => {
      store.put(product)
    })
    
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getProducts(tenantId: string): Promise<OfflineProduct[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('products', 'readonly')
    const store = tx.objectStore('products')
    const index = store.index('tenantId')
    const request = index.getAll(IDBKeyRange.only(tenantId))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getProductByBarcode(tenantId: string, barcode: string): Promise<OfflineProduct | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('products', 'readonly')
    const store = tx.objectStore('products')
    const index = store.index('barcode')
    const request = index.get(barcode)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const product = request.result as OfflineProduct
      if (product && product.tenantId === tenantId) {
        resolve(product)
      } else {
        resolve(null)
      }
    }
  })
}

export async function updateProductStock(productId: string, newStock: number): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('products', 'readwrite')
    const store = tx.objectStore('products')
    const getRequest = store.get(productId)
    
    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const product = getRequest.result as OfflineProduct
      if (product) {
        product.stock = newStock
        product.updatedAt = new Date().toISOString()
        const putRequest = store.put(product)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
  })
}

export async function saveCustomers(customers: OfflineCustomer[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('customers', 'readwrite')
    const store = tx.objectStore('customers')
    
    customers.forEach(customer => {
      store.put(customer)
    })
    
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCustomers(tenantId: string): Promise<OfflineCustomer[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('customers', 'readonly')
    const store = tx.objectStore('customers')
    const index = store.index('tenantId')
    const request = index.getAll(IDBKeyRange.only(tenantId))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>): Promise<void> {
  const database = await initDB()
  const syncItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0
  }
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    const request = store.put(syncItem)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('syncQueue', 'readonly')
    const store = tx.objectStore('syncQueue')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const items = request.result as SyncQueueItem[]
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      resolve(items)
    }
  })
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    const getRequest = store.get(id)
    
    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const item = getRequest.result as SyncQueueItem
      if (item) {
        Object.assign(item, updates)
        const putRequest = store.put(item)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
  })
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', 'readwrite')
    const store = tx.objectStore('settings')
    const request = store.put({ key, value })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', 'readonly')
    const store = tx.objectStore('settings')
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.value : null)
    }
  })
}

export async function clearAllData(): Promise<void> {
  const database = await initDB()
  const stores = ['sales', 'products', 'customers', 'syncQueue', 'settings']
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction(stores, 'readwrite')
    stores.forEach(storeName => {
      tx.objectStore(storeName).clear()
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
