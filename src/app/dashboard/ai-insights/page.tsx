"use client"

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  TrendingUp, 
  Package,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Bell,
  AlertCircle
} from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import { toast } from 'sonner'

interface AIInsight {
  id: number
  insightType: 'prediction' | 'reorder' | 'anomaly' | 'weekly_report'
  title: string
  description: string
  dataJson: any
  confidenceScore: number | null
  isRead: boolean
  createdAt: string
}

export default function AIInsightsPage() {
  const { role, loading } = useUserRole()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchInsights = async () => {
    try {
      const filterParam = filter !== 'all' ? `&insight_type=${filter}` : ''
      const response = await fetch(`/api/ai/insights?limit=50${filterParam}`)
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
        setUnreadCount(data.unread_count || 0)
      } else {
        toast.error('Failed to fetch insights')
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/ai/insights?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      })

      if (response.ok) {
        fetchInsights()
      }
    } catch (error) {
      console.error('Error marking insight as read:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchInsights()
      setIsLoading(false)
    }

    if (!loading) {
      loadData()
    }
  }, [loading, filter])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp className="w-5 h-5 text-blue-600" />
      case 'reorder':
        return <Package className="w-5 h-5 text-orange-600" />
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'weekly_report':
        return <FileText className="w-5 h-5 text-green-600" />
      default:
        return <Brain className="w-5 h-5" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'decreasing':
        return <ArrowDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              AI Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Predictions, forecasts, and business intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {unreadCount} new
              </Badge>
            )}
            <Button onClick={fetchInsights} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notice about AI features */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                AI Features Coming Soon
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Advanced AI predictions, anomaly detection, and reorder forecasting will be available once you set up your database.
              </p>
            </div>
          </div>
        </Card>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Insights
          </Button>
          <Button
            variant={filter === 'prediction' ? 'default' : 'outline'}
            onClick={() => setFilter('prediction')}
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Predictions
          </Button>
          <Button
            variant={filter === 'reorder' ? 'default' : 'outline'}
            onClick={() => setFilter('reorder')}
            size="sm"
          >
            <Package className="w-4 h-4 mr-1" />
            Reorders
          </Button>
          <Button
            variant={filter === 'anomaly' ? 'default' : 'outline'}
            onClick={() => setFilter('anomaly')}
            size="sm"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Anomalies
          </Button>
        </div>

        {/* Insights List */}
        {insights.length === 0 ? (
          <Card className="p-12 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No insights yet</h3>
            <p className="text-gray-600 mb-6">
              AI insights will appear here once your database is set up
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card
                key={insight.id}
                className={`p-6 ${!insight.isRead ? 'border-primary border-2' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getInsightIcon(insight.insightType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{insight.title}</h3>
                        {!insight.isRead && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                        {insight.confidenceScore && (
                          <Badge variant="outline" className="text-xs">
                            {(insight.confidenceScore * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {insight.description}
                      </p>

                      {/* Prediction Details */}
                      {insight.insightType === 'prediction' && insight.dataJson?.summary && (
                        <div className="grid sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Average Daily</p>
                            <p className="text-xl font-bold">
                              GH₵{insight.dataJson.summary.average_daily_sales.toFixed(0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Avg</p>
                            <p className="text-xl font-bold flex items-center gap-2">
                              GH₵{insight.dataJson.summary.predicted_average.toFixed(0)}
                              {getTrendIcon(insight.dataJson.summary.trend)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                            <p className={`text-xl font-bold ${
                              insight.dataJson.summary.growth_rate > 0 ? 'text-green-600' : 
                              insight.dataJson.summary.growth_rate < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {insight.dataJson.summary.growth_rate > 0 ? '+' : ''}
                              {insight.dataJson.summary.growth_rate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Reorder Details */}
                      {insight.insightType === 'reorder' && insight.dataJson?.summary && (
                        <div className="grid sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                            <p className="text-2xl font-bold text-red-600">
                              {insight.dataJson.summary.high_priority}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {insight.dataJson.summary.medium_priority}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">At Risk</p>
                            <p className="text-2xl font-bold text-red-600">
                              {insight.dataJson.summary.products_at_risk}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Est. Cost</p>
                            <p className="text-2xl font-bold">
                              GH₵{insight.dataJson.summary.total_estimated_reorder_cost.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Anomaly Details */}
                      {insight.insightType === 'anomaly' && insight.dataJson?.summary && (
                        <div className="grid sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Anomalies</p>
                            <p className="text-2xl font-bold">
                              {insight.dataJson.summary.total_anomalies}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">High Severity</p>
                            <p className="text-2xl font-bold text-red-600">
                              {insight.dataJson.summary.high_severity}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Medium Severity</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {insight.dataJson.summary.medium_severity}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Requires Attention</p>
                            <p className="text-2xl font-bold text-red-600">
                              {insight.dataJson.summary.requires_attention}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                        <span>
                          {new Date(insight.createdAt).toLocaleDateString()} {new Date(insight.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!insight.isRead && (
                    <Button
                      onClick={() => markAsRead(insight.id)}
                      variant="outline"
                      size="sm"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}