'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  History, 
  Zap, 
  Check, 
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/lib/supabase-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function BillingPage() {
  const { tenantId } = useUserRole()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [orgData, setOrgData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (tenantId) {
      fetchBillingData()
    }
  }, [tenantId])

  async function fetchBillingData() {
    try {
      setLoading(true)
      
      // Fetch organization billing info
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (orgError) throw orgError
      setOrgData(org)

      // Fetch wallet transactions
      const { data: txs, error: txsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('organization_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (txsError) throw txsError
      setTransactions(txs || [])

    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBillingMode = async (mode: 'subscription' | 'pay_as_you_go') => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ billing_mode: mode })
        .eq('id', tenantId)
      
      if (error) throw error
      setOrgData({ ...orgData, billing_mode: mode })
      toast.success(`Switched to ${mode === 'pay_as_you_go' ? 'Pay-as-you-go' : 'Subscription'} plan`)
    } catch (error) {
      toast.error('Failed to update billing mode')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Wallet</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your subscription and usage credits</p>
        </div>

        {/* Wallet Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-8 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80 uppercase tracking-wider">Wallet Balance</p>
                  <h2 className="text-5xl font-black">₵{Number(orgData?.wallet_balance || 0).toFixed(2)}</h2>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 rounded-xl">
                  <ArrowUpRight className="w-5 h-5 mr-2" />
                  Top Up Wallet
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 rounded-xl backdrop-blur-sm">
                  <History className="w-5 h-5 mr-2" />
                  View All History
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-none flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Current Mode</p>
              <Badge className={`text-lg py-1 px-4 rounded-full ${
                orgData?.billing_mode === 'pay_as_you_go' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
              }`}>
                {orgData?.billing_mode === 'pay_as_you_go' ? 'Pay-as-you-go' : 'Subscription'}
              </Badge>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                {orgData?.billing_mode === 'pay_as_you_go' 
                  ? 'You are charged GHS 5.00 only on days you process a sale.' 
                  : 'You are on a fixed monthly plan.'}
              </p>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary font-bold justify-start group"
              onClick={() => toggleBillingMode(orgData?.billing_mode === 'pay_as_you_go' ? 'subscription' : 'pay_as_you_go')}
            >
              Switch Plan
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Usage Billing */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Pay-as-you-go Benefits
            </h3>
            <div className="space-y-3">
              {[
                'Only pay when you sell (Active days)',
                'GHS 3-7 per day (based on volume)',
                'No fixed monthly pressure',
                'Ideal for small & seasonal shops',
                'Stop anytime, balance stays'
              ].map(benefit => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Payments */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Secure & Reliable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Our billing system is designed for the Ghanaian market. Top up easily with Mobile Money or Bank Transfer. All transactions are logged and verifiable.
            </p>
            <div className="flex gap-4">
              {['mtn', 'telecel', 'at', 'bank'].map(p => (
                <div key={p} className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-400">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="shadow-xl border-none overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <Button variant="ghost" size="sm" className="text-primary font-bold">See All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 font-bold">Description</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-400">Ref: {tx.id.substring(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="capitalize text-[10px] font-black">
                          {tx.type}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 text-right font-black text-sm ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}₵{Math.abs(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Help/FAQ */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-8 border border-orange-100 dark:border-orange-900/20">
          <div className="flex gap-4">
            <HelpCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div>
              <h4 className="text-xl font-bold text-orange-900 dark:text-orange-400 mb-2">How does Pay-as-you-go work?</h4>
              <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed">
                It's simple: We only charge you on days when you process at least one sale. If your shop is closed for a week, you pay ₵0. This allows you to scale your costs with your business activity. You can switch back to a monthly subscription anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
