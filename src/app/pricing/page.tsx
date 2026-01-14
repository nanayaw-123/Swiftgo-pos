"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { 
  Check, 
  X, 
  Zap, 
  Star,
  CircleCheck,
  Sparkles,
  Shield,
  Brain,
  Infinity,
  Target,
  Smartphone,
  Wifi,
  Users,
  Store,
  Receipt,
  TrendingUp,
  Gift,
  DollarSign,
  ShoppingBag,
  BarChart3,
  Plus
} from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Ghana-First Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Pricing Built for
            <span className="text-primary block mt-2">Ghanaian Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            From market stalls to multi-branch SMEs. Pay only for what you use. No hidden fees. Works offline.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-green-600" />
              Start free forever
            </span>
            <span className="flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-green-600" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-green-600" />
              MoMo payments accepted
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <Badge variant="secondary" className="mb-3">Free Forever</Badge>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Starter</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">For micro-businesses just starting out</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">GHS 0</span>
                <span className="text-gray-600 dark:text-gray-400">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  { text: 'Up to 50 products', included: true },
                  { text: 'Offline sales', included: true },
                  { text: 'Cash recording', included: true },
                  { text: 'MoMo recording', included: true },
                  { text: 'Watermark on receipts', included: true },
                  { text: '1 staff user', included: true },
                  { text: 'Basic reports', included: true },
                  { text: 'Inventory tracking', included: false },
                  { text: 'Debt tracking', included: false },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? '' : 'text-gray-400'}`}>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full py-6 text-lg">
                  Start Free
                </Button>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all border-2 border-blue-500 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                <DollarSign className="w-3 h-3 mr-1 inline" />
                Pay Per Use
              </Badge>
              <div className="mb-4">
                <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700">Micro Plan</Badge>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Pay-As-You-Sell</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Only pay on days you make sales</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-blue-600">GHS 5</span>
                <span className="text-gray-600 dark:text-gray-400">/selling day</span>
                <p className="text-xs text-gray-500 mt-1">No sales? No charge!</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  { text: 'Unlimited products', included: true },
                  { text: 'Unlimited sales', included: true },
                  { text: 'Offline mode', included: true },
                  { text: 'Inventory tracking', included: true },
                  { text: 'Customer debt tracking', included: true },
                  { text: 'MoMo auto-reconciliation', included: true },
                  { text: 'Up to 2 staff users', included: true },
                  { text: 'No watermark receipts', included: true },
                  { text: 'Staff permissions', included: false },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'font-medium' : 'text-gray-400'}`}>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full py-6 text-lg border-blue-500 text-blue-600 hover:bg-blue-50">
                  Start Free Trial
                </Button>
              </Link>
            </Card>

            <Card className="p-6 border-4 border-primary relative hover:shadow-2xl transition-all transform lg:scale-105 bg-gradient-to-b from-primary/5 to-transparent">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                <Star className="w-3 h-3 mr-1 inline fill-white" />
                Most Popular
              </Badge>
              <div className="mb-4">
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary">Best Value</Badge>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Business</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">For growing shops & SMEs</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">GHS 120</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
                <p className="text-xs text-gray-500 mt-1">~GHS 4/day - cheaper than daily!</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  { text: 'Unlimited products', included: true },
                  { text: 'Up to 10 staff accounts', included: true },
                  { text: 'Staff roles & permissions', included: true },
                  { text: 'Profit & margin reports', included: true },
                  { text: 'Stock alerts & notifications', included: true },
                  { text: 'Customer debt tracking', included: true },
                  { text: 'Supplier debt tracking', included: true },
                  { text: 'WhatsApp receipts', included: true },
                  { text: 'MoMo auto-reconciliation', included: true },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full py-6 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all border-2 border-purple-500 bg-gradient-to-b from-purple-50 to-transparent dark:from-purple-900/20">
              <div className="mb-4">
                <Badge variant="secondary" className="mb-3 bg-purple-100 text-purple-700">Enterprise</Badge>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Multi-Branch</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">For SMEs with multiple locations</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-purple-600">GHS 350</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <p className="text-sm text-purple-600 font-medium mb-6">
                + GHS 50 per additional branch
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { text: 'Everything in Business', included: true },
                  { text: 'Unlimited branches', included: true },
                  { text: 'Central dashboard', included: true },
                  { text: 'Branch comparison reports', included: true },
                  { text: 'Role-based access control', included: true },
                  { text: 'Unlimited staff', included: true },
                  { text: 'Stock transfers', included: true },
                  { text: 'Priority 24/7 support', included: true },
                  { text: 'Dedicated account manager', included: true },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full py-6 text-lg border-purple-500 text-purple-600 hover:bg-purple-50">
                  Start Free Trial
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Plus className="w-4 h-4 mr-2 inline" />
              Power-Up Add-Ons
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Boost Your Business with Add-Ons
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Add these features to any paid plan when you need them
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Loyalty & Rewards</h3>
              <p className="text-2xl font-bold text-pink-600 mb-2">GHS 30<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Customer points system</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Rewards redemption</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Customer tiers (VIP)</li>
              </ul>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Payroll & Commissions</h3>
              <p className="text-2xl font-bold text-green-600 mb-2">GHS 40<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Salary management</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Commission tracking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Payslip generation</li>
              </ul>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Online Store / Orders</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">GHS 50<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Online ordering</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Delivery tracking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Payment links</li>
              </ul>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
              <p className="text-2xl font-bold text-purple-600 mb-2">GHS 30<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />AI predictions</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Trend analysis</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" />Custom reports</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Target className="w-4 h-4 mr-2 inline" />
              Feature Comparison
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Compare All Plans
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-4 text-left font-bold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-4 py-4 text-center font-bold">Starter<br/><span className="text-xs font-normal text-gray-500">GHS 0</span></th>
                  <th className="px-4 py-4 text-center font-bold text-blue-600">Pay-As-You-Sell<br/><span className="text-xs font-normal">GHS 5/day</span></th>
                  <th className="px-4 py-4 text-center bg-primary/10 font-bold text-primary">Business<br/><span className="text-xs font-normal">GHS 120/mo</span></th>
                  <th className="px-4 py-4 text-center font-bold text-purple-600">Multi-Branch<br/><span className="text-xs font-normal">GHS 350/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { feature: 'Products', starter: '50', payg: 'Unlimited', business: 'Unlimited', multi: 'Unlimited' },
                  { feature: 'Staff Users', starter: '1', payg: '2', business: '10', multi: 'Unlimited' },
                  { feature: 'Branches', starter: '1', payg: '1', business: '1', multi: 'Unlimited' },
                  { feature: 'Offline Sales', starter: true, payg: true, business: true, multi: true },
                  { feature: 'Cash Payments', starter: true, payg: true, business: true, multi: true },
                  { feature: 'MoMo Payments', starter: true, payg: true, business: true, multi: true },
                  { feature: 'QR Code Payments', starter: false, payg: true, business: true, multi: true },
                  { feature: 'Bank Transfers', starter: false, payg: true, business: true, multi: true },
                  { feature: 'Inventory Tracking', starter: false, payg: true, business: true, multi: true },
                  { feature: 'Customer Debt Tracking', starter: false, payg: true, business: true, multi: true },
                  { feature: 'Supplier Debt Tracking', starter: false, payg: false, business: true, multi: true },
                  { feature: 'MoMo Auto-Reconciliation', starter: false, payg: true, business: true, multi: true },
                  { feature: 'Staff Permissions', starter: false, payg: false, business: true, multi: true },
                  { feature: 'Profit & Margin Reports', starter: false, payg: false, business: true, multi: true },
                  { feature: 'Stock Alerts', starter: false, payg: false, business: true, multi: true },
                  { feature: 'WhatsApp Receipts', starter: false, payg: false, business: true, multi: true },
                  { feature: 'Central Dashboard', starter: false, payg: false, business: false, multi: true },
                  { feature: 'Branch Comparison', starter: false, payg: false, business: false, multi: true },
                  { feature: 'Stock Transfers', starter: false, payg: false, business: false, multi: true },
                  { feature: 'Receipt Watermark', starter: 'Yes', payg: 'No', business: 'No', multi: 'No' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-sm">{row.starter}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {typeof row.payg === 'boolean' ? (
                        row.payg ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-sm">{row.payg}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center bg-primary/5">
                      {typeof row.business === 'boolean' ? (
                        row.business ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-sm font-semibold">{row.business}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {typeof row.multi === 'boolean' ? (
                        row.multi ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-sm">{row.multi}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              vs Global Competitors
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Why SwiftPOS Beats International POS Systems
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Built for Ghana, priced for Ghana, works in Ghana
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-4 text-left font-bold">Feature</th>
                  <th className="px-4 py-4 text-center bg-primary text-white">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold">SwiftPOS</span>
                      <Badge variant="secondary" className="text-xs">Ghana-First</Badge>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-gray-600">Square</th>
                  <th className="px-4 py-4 text-center font-medium text-gray-600">Shopify POS</th>
                  <th className="px-4 py-4 text-center font-medium text-gray-600">Lightspeed</th>
                  <th className="px-4 py-4 text-center font-medium text-gray-600">Clover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { feature: 'Starting Price (GHS)', swiftpos: 'Free', square: '~₵950/mo', shopify: '~₵450/mo', lightspeed: '~₵1,100/mo', clover: '~₵250/mo*' },
                  { feature: 'MTN MoMo', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'Vodafone Cash', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'AirtelTigo Money', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'Customer Debt Tracking', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'Supplier Credit Management', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'Works Offline (100%)', swiftpos: true, square: 'Limited', shopify: false, lightspeed: 'Limited', clover: 'Limited' },
                  { feature: 'Daily Profit Calculation', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'WhatsApp Receipts', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'No Hardware Lock-in', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'Pay-Per-Day Option', swiftpos: true, square: false, shopify: false, lightspeed: false, clover: false },
                  { feature: 'GHS Currency Native', swiftpos: true, square: false, shopify: true, lightspeed: true, clover: false },
                  { feature: 'Local Support', swiftpos: 'Ghana', square: 'USA', shopify: 'Canada', lightspeed: 'Canada', clover: 'USA' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-sm">{row.feature}</td>
                    <td className="px-4 py-3 text-center bg-primary/5">
                      {typeof row.swiftpos === 'boolean' ? (
                        row.swiftpos ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                      ) : (
                        <span className="font-bold text-primary text-sm">{row.swiftpos}</span>
                      )}
                    </td>
                    {['square', 'shopify', 'lightspeed', 'clover'].map((comp) => (
                      <td key={comp} className="px-4 py-3 text-center">
                        {typeof row[comp as keyof typeof row] === 'boolean' ? (
                          row[comp as keyof typeof row] ? <CircleCheck className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-gray-600 text-sm">{row[comp as keyof typeof row] as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-center mt-6 text-sm text-gray-500">
            * Clover requires proprietary hardware starting at $499+ USD. Prices converted at approx rates.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Ghana Businesses Choose SwiftPOS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">MoMo-Native</h3>
              <p className="text-gray-600 dark:text-gray-300">
                MTN MoMo, Vodafone Cash, and AirtelTigo Money are first-class citizens—not afterthoughts. Auto-reconciliation included.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Offline-First</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Power cuts? No internet? No problem. SwiftPOS works 100% offline and syncs automatically when you're back online.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ghana Workflows</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Customer debt, supplier credit, daily profit calculation—the features Ghanaian businesses actually need.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Pricing Questions Answered
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does Pay-As-You-Sell work?',
                a: 'You only pay GHS 5 on days when you make at least one sale. No sales? No charge. It\'s perfect for businesses with irregular selling days like markets or pop-ups.'
              },
              {
                q: 'Can I switch between plans?',
                a: 'Yes! Upgrade or downgrade anytime. If you switch from Pay-As-You-Sell to Business plan mid-month, we\'ll prorate the charges fairly.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept MTN MoMo, Vodafone Cash, AirtelTigo Money, and bank transfers. We make it easy to pay the Ghanaian way.'
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts! Cancel anytime. We believe in earning your business every month through great service.'
              },
              {
                q: 'What happens if I exceed my product limit on Starter?',
                a: 'We\'ll notify you when you\'re close to 50 products. You can upgrade to Pay-As-You-Sell or Business plan for unlimited products.'
              },
              {
                q: 'How much does an extra branch cost?',
                a: 'On the Multi-Branch plan, each additional branch beyond the first is GHS 50/month. So 3 branches = GHS 350 + GHS 100 = GHS 450/month.'
              }
            ].map((faq, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Growing Your Business Today
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Join thousands of Ghanaian businesses already using SwiftPOS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-12 py-7">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Forever
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-12 py-7 bg-white/10 border-white/30 text-white hover:bg-white/20">
                Talk to Sales
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/70">
            No credit card required • Works offline • MoMo accepted
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
