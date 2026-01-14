'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Truck, Phone, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function DebtDashboard() {
  const [customerDebts, setCustomerDebts] = useState([])
  const [supplierDebts, setSupplierDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      const [custRes, suppRes] = await Promise.all([
        fetch('/api/debts/customer'),
        fetch('/api/debts/supplier')
      ])
      const [custData, suppData] = await Promise.all([
        custRes.json(),
        suppRes.json()
      ])
      setCustomerDebts(custData)
      setSupplierDebts(suppData)
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDebt = async (type, id, amount) => {
    const endpoint = type === 'customer' ? '/api/debts/customer' : '/api/debts/supplier'
    try {
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount_paid: amount, status: 'settled' })
      })
      fetchDebts()
    } catch (error) {
      console.error('Error updating debt:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Debt Tracking</h1>
            <p className="text-muted-foreground">Manage customer credit and supplier payments</p>
          </div>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Customers
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="w-4 h-4" /> Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDebts.map((debt: any) => (
                <Card key={debt.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{debt.customers?.name || 'Walk-in Customer'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {debt.customers?.phone || 'No phone'}
                      </p>
                    </div>
                    <Badge variant={debt.status === 'settled' ? 'secondary' : 'destructive'}>
                      {debt.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owed:</span>
                      <span className="font-semibold">GHS {debt.amount_owed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="text-green-600 font-semibold">GHS {debt.amount_paid}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-bold">Balance:</span>
                      <span className="font-bold text-red-600">GHS {debt.amount_owed - debt.amount_paid}</span>
                    </div>
                  </div>

                  {debt.status === 'open' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpdateDebt('customer', debt.id, debt.amount_owed - debt.amount_paid)}
                    >
                      Record Payment
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplierDebts.map((debt: any) => (
                <Card key={debt.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{debt.suppliers?.name || 'General Supplier'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {debt.suppliers?.phone || 'No phone'}
                      </p>
                    </div>
                    <Badge variant={debt.status === 'settled' ? 'secondary' : 'destructive'}>
                      {debt.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">GHS {debt.amount}</span>
                    </div>
                  </div>

                  {debt.status === 'open' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpdateDebt('supplier', debt.id, 'settled')}
                    >
                      Mark as Settled
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
