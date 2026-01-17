// components/sync-status.tsx

'use client'

import { useSync } from '@/hooks/use-sync'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SyncStatus() {
  const { status, syncNow, hasPending, isSyncing } = useSync()
  const isOnline = typeof window !== 'undefined' && navigator.onLine

  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Online/Offline Indicator */}
          <div className="relative">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-orange-500" />
            )}
            {isSyncing && (
              <div className="absolute -top-1 -right-1 w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
              
              {hasPending && (
                <Badge variant="warning" className="text-xs">
                  {status.pendingCount} pending
                </Badge>
              )}

              {status.failedCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {status.failedCount} failed
                </Badge>
              )}
            </div>

            {/* Last Sync Time */}
            {status.lastSync && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Last synced {formatDistanceToNow(status.lastSync, { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Sync Button */}
        {isOnline && hasPending && (
          <Button
            size="sm"
            onClick={syncNow}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}

        {/* Success Indicator */}
        {isOnline && !hasPending && !isSyncing && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">All synced</span>
          </div>
        )}
      </div>

      {/* Warning Message for Offline */}
      {!isOnline && hasPending && (
        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-300">
              You have {status.pendingCount} unsaved sale(s). They will sync automatically when you're back online.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// components/sync-indicator-badge.tsx
// Small compact version for navbar/header




export function SyncIndicatorBadge() {
  const { status, hasPending, isSyncing } = useSync()
  const isOnline = typeof window !== 'undefined' && navigator.onLine

  if (!isOnline && hasPending) {
    return (
      <Badge variant="warning" className="gap-1">
        <WifiOff className="w-3 h-3" />
        {status.pendingCount} pending
      </Badge>
    )
  }

  if (isSyncing) {
    return (
      <Badge className="gap-1">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Syncing...
      </Badge>
    )
  }

  if (isOnline && hasPending) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Wifi className="w-3 h-3" />
        {status.pendingCount} to sync
      </Badge>
    )
  }

  return null
}