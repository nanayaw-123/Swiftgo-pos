"use client"

import { SetStateAction, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Loader2, Search, Download, Activity, ShieldCheck, AlertTriangle, Info, Calendar, Filter, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/hooks/use-auth'

interface AuditLog {
  id: number
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  ip_address: string | null
  user_agent: string | null
  tenant_id: string
  created_at: string
  user_email?: string
  user_name?: string
}

export default function AuditLogsPage() {
    const { tenantId, role, loading: roleLoading } = useUserRole()
  const { session, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const getToken = async () => {
    return localStorage.getItem('bearer_token') || session?.access_token || ''
  }

  useEffect(() => {
    if (tenantId && session) {
      loadAuditLogs()
    }
  }, [tenantId, session])

  const loadAuditLogs = async () => {
    if (!tenantId) return
    
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load audit logs')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Create</Badge>
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Update</Badge>
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Delete</Badge>
    }
    if (actionLower.includes('login') || actionLower.includes('auth')) {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Auth</Badge>
    }
    if (actionLower.includes('sale') || actionLower.includes('checkout')) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Sale</Badge>
    }
    return <Badge variant="outline">{action}</Badge>
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toLowerCase()) {
      case 'product':
        return '📦'
      case 'sale':
        return '💰'
      case 'user':
        return '👤'
      case 'store':
        return '🏪'
      case 'inventory':
        return '📊'
      default:
        return '📋'
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details']
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_email || log.user_id,
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.ip_address || '',
      JSON.stringify(log.details || {})
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Audit logs exported')
  }

  // Apply filters
  let filteredLogs = logs

  // Date filter
  if (dateFilter !== 'all') {
    const now = new Date()
    let startDate = new Date()
    
    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    filteredLogs = filteredLogs.filter(log => new Date(log.created_at) >= startDate)
  }

  // Action filter
  if (actionFilter !== 'all') {
    filteredLogs = filteredLogs.filter(log => 
      log.action.toLowerCase().includes(actionFilter.toLowerCase())
    )
  }

  // Entity filter
  if (entityFilter !== 'all') {
    filteredLogs = filteredLogs.filter(log => 
      log.entity_type?.toLowerCase() === entityFilter.toLowerCase()
    )
  }

  // Search filter
  if (searchQuery) {
    filteredLogs = filteredLogs.filter(log =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Get unique entity types for filter
  const entityTypes = [...new Set(logs.map(log => log.entity_type).filter(Boolean))]
  const actionTypes = [...new Set(logs.map(log => {
    const action = log.action.toLowerCase()
    if (action.includes('create')) return 'create'
    if (action.includes('update')) return 'update'
    if (action.includes('delete')) return 'delete'
    if (action.includes('login') || action.includes('auth')) return 'auth'
    if (action.includes('sale')) return 'sale'
    return 'other'
  }))]

  // Stats
  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.created_at)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length,
    creates: logs.filter(log => log.action.toLowerCase().includes('create')).length,
    updates: logs.filter(log => log.action.toLowerCase().includes('update')).length
  }

  // Only owners and managers can view audit logs
  if (role === 'cashier') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <ShieldCheck className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only owners and managers can view audit logs.</p>
        </div>
      </DashboardLayout>
    )
  }

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
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-gray-600">Track all system activities and changes</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Creates</p>
                <p className="text-2xl font-bold">{stats.creates}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Updates</p>
                <p className="text-2xl font-bold">{stats.updates}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search logs by action, entity, or user..."
                value={searchQuery}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-gray-500">Loading audit logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No audit logs found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchQuery || actionFilter !== 'all' || entityFilter !== 'all' 
                          ? 'Try adjusting your filters'
                          : 'System activities will appear here'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(log.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {log.user_name || log.user_email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                              {log.user_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getEntityIcon(log.entity_type)}</span>
                          <div>
                            <p className="font-medium capitalize">{log.entity_type || 'N/A'}</p>
                            {log.entity_id && (
                              <p className="text-xs text-gray-500 font-mono">#{log.entity_id}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {log.details ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                              {typeof log.details === 'object' 
                                ? JSON.stringify(log.details)
                                : String(log.details)
                              }
                            </code>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {log.ip_address || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination info */}
        {filteredLogs.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}