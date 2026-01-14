"use client"

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Plus, MapPin, Pencil, Trash2, Store, Loader2, Users, Package, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'

interface StoreData {
  id: number
  name: string
  location: string
  tenant_id: string
  created_at: string
}

export default function StoresPage() {
    const { tenantId, role, loading: roleLoading } = useUserRole()
  const { session, loading: authLoading } = useAuth()
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  })

  const getToken = async () => {
    return localStorage.getItem('bearer_token') || session?.access_token || ''
  }

  useEffect(() => {
    if (tenantId && session) {
      loadStores()
    }
  }, [tenantId, session])

  const loadStores = async () => {
    if (!tenantId) return
    
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load stores')
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error('Error loading stores:', error)
      toast.error('Failed to load stores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = await getToken()
      if (editingStore) {
        const response = await fetch(`/api/stores/${editingStore.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Failed to update store')
        toast.success('Store updated successfully')
      } else {
        const response = await fetch('/api/stores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Failed to create store')
        toast.success('Store created successfully')
      }

      setDialogOpen(false)
      resetForm()
      await loadStores()
    } catch (error) {
      console.error('Error saving store:', error)
      toast.error('Failed to save store')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete store')
      toast.success('Store deleted successfully')
      await loadStores()
    } catch (error) {
      console.error('Error deleting store:', error)
      toast.error('Failed to delete store')
    }
  }

  const handleEdit = (store: StoreData) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      location: store.location
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingStore(null)
    setFormData({ name: '', location: '' })
  }

  const canManageStores = role === 'owner' || role === 'manager'

  if (roleLoading || authLoading || !tenantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store Locations</h1>
            <p className="text-gray-600">Manage your store locations and branches</p>
          </div>
          {canManageStores && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStore ? 'Edit Store' : 'Add New Store'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStore ? 'Update store details' : 'Create a new store location'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Store Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Main Store"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location / Address *</Label>
                    <Input
                      id="location"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="123 Main St, Accra, Ghana"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingStore ? 'Update Store' : 'Create Store'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stores</p>
                <p className="text-2xl font-bold">{stores.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Locations</p>
                <p className="text-2xl font-bold">{stores.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Multi-Store</p>
                <p className="text-2xl font-bold">{stores.length > 1 ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stores.length === 0 ? (
          <Card className="p-12 text-center">
            <Store className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stores yet</h3>
            <p className="text-gray-600 mb-6">Create your first store location to get started</p>
            {canManageStores && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Store
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.location}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Store ID</span>
                    <span className="font-mono">#{store.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span>{format(new Date(store.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                
                {canManageStores && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(store)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        if (stores.length === 1) {
                          toast.error('Cannot delete the last store')
                          return
                        }
                        handleDelete(store.id)
                      }}
                      disabled={stores.length === 1}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}