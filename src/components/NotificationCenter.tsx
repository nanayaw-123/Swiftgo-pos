'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, TrendingUp, Users, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SystemAlert {
  id: number;
  alert_type: 'low_stock' | 'expiry_warning' | 'sales_milestone' | 'staff_activity' | 'fraud_detection' | 'system_info';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  related_id?: number;
  related_type?: string;
  is_read: boolean;
  is_dismissed: boolean;
  action_url?: string;
  created_at: string;
}

const ALERT_ICONS = {
  low_stock: Package,
  expiry_warning: AlertTriangle,
  sales_milestone: TrendingUp,
  staff_activity: Users,
  fraud_detection: AlertCircle,
  system_info: Info,
};

const SEVERITY_COLORS = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
};

export function NotificationCenter() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/system-alerts?is_dismissed=false&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        setUnreadCount(data.filter((a: SystemAlert) => !a.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark alert as read
  const markAsRead = async (alertId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/system-alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: alertId,
          is_read: true,
        }),
      });

      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const unreadAlerts = alerts.filter(a => !a.is_read);
      
      await Promise.all(
        unreadAlerts.map(alert =>
          fetch('/api/system-alerts', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: alert.id,
              is_read: true,
            }),
          })
        )
      );

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Dismiss alert
  const dismissAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/system-alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: alertId,
          is_dismissed: true,
        }),
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        setUnreadCount(prev => {
          const alert = alerts.find(a => a.id === alertId);
          return alert && !alert.is_read ? Math.max(0, prev - 1) : prev;
        });
        toast.success('Notification dismissed');
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast.error('Failed to dismiss notification');
    }
  };

  // Handle alert click
  const handleAlertClick = (alert: SystemAlert) => {
    markAsRead(alert.id);
    if (alert.action_url) {
      router.push(alert.action_url);
      setIsOpen(false);
    }
  };

  // Poll for new alerts every 30 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {alerts.map((alert) => {
                const Icon = ALERT_ICONS[alert.alert_type];
                const severityClass = SEVERITY_COLORS[alert.severity];
                
                return (
                  <Card 
                    key={alert.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      !alert.is_read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${severityClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium line-clamp-1">{alert.title}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlert(alert.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center cursor-pointer"
              onClick={() => {
                router.push('/dashboard/notifications');
                setIsOpen(false);
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
