import Dexie, { Table } from 'dexie'

export interface OfflineSale {
  id?: number
  tenant_id: string
  store_id: string
  cashier_id: string
  items: Array<{ product_id: string; quantity: number; price: number; name: string }>
  total: number
  payment_method: 'cash' | 'card' | 'digital'
  created_at: string
  synced: boolean
}

export interface CachedProduct {
  id: string
  tenant_id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  stock: number
  category: string
  image_url: string | null
  updated_at: string
}

export class SwiftPOSDB extends Dexie {
  offlineSales!: Table<OfflineSale>
  cachedProducts!: Table<CachedProduct>

  constructor() {
    super('SwiftPOSDB')
    this.version(1).stores({
      offlineSales: '++id, tenant_id, synced, created_at',
      cachedProducts: 'id, tenant_id, barcode, sku'
    })
  }
}

export const db = new SwiftPOSDB()
