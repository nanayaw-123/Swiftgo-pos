"use client"

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  Database,
  Info
} from 'lucide-react'

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time stock tracking, alerts, and expiry management
            </p>
          </div>
        </div>

        {/* Database Setup Notice */}
        <Card className="p-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">
                Database Setup Required
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Inventory management features require database integration to track stock levels, 
                alerts, and expiry dates in real-time.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Available features once database is set up:</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Real-time stock level tracking and inventory value
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Automated low stock alerts and notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-red-600" />
                    Product expiry tracking and early warnings
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    Fast-moving product analysis and reorder recommendations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Preview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-3xl font-bold mt-2">-</p>
              </div>
              <Package className="w-12 h-12 text-primary opacity-20" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Track all products in your inventory
            </p>
          </Card>

          <Card className="p-6 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</p>
                <p className="text-3xl font-bold mt-2">-</p>
              </div>
              <Database className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Total value of all stock
            </p>
          </Card>

          <Card className="p-6 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                <p className="text-3xl font-bold mt-2">-</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Low stock notifications
            </p>
          </Card>

          <Card className="p-6 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-3xl font-bold mt-2">-</p>
              </div>
              <Info className="w-12 h-12 text-red-600 opacity-20" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Products expiring within 30 days
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}