"use client"

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { 
  ShoppingCart, 
  BarChart3, 
  Package, 
  Users, 
  Zap, 
  Shield,
  CreditCard,
  Smartphone,
  Cloud,
  Lock,
  RefreshCw,
  FileText,
  Globe,
  TrendingUp,
  Database,
  Bell,
  Brain,
  Target,
  Wifi,
  Camera,
  Receipt,
  Sparkles,
  CircleCheck,
  AlertTriangle,
  Scan,
  Store,
  Clock,
  Upload,
  SmartphoneNfc,
  Wallet,
  Calculator,
  MessageSquare,
  Check
} from 'lucide-react'

const features = [
  {
    icon: ShoppingCart,
    title: 'Lightning-Fast POS Terminal',
    description: 'Process sales in seconds with keyboard shortcuts, barcode scanning, and one-click checkout. Optimized for high-traffic Ghanaian markets.',
    color: 'bg-blue-500/10 text-blue-600',
    category: 'Core'
  },
  {
    icon: SmartphoneNfc,
    title: 'Native MoMo Integration',
    description: 'Accept MTN MoMo, Telecel Cash, and AT Money directly. Push USSD prompts to customers and get real-time screen confirmation.',
    color: 'bg-amber-500/10 text-amber-600',
    category: 'Payments'
  },
  {
    icon: Wallet,
    title: 'Customer Debt Ledgers',
    description: 'Track "book" sales and customer credit. Send automated payment reminders via WhatsApp with one click.',
    color: 'bg-emerald-500/10 text-emerald-600',
    category: 'Finance'
  },
  {
    icon: Calculator,
    title: 'Daily Profit Analytics',
    description: 'Know exactly what you earned today. Automated calculation of Gross Profit, COGS, and Expenses.',
    color: 'bg-purple-500/10 text-purple-600',
    category: 'Analytics'
  },
  {
    icon: Wifi,
    title: '100% Offline Mode',
    description: 'Sell without internet. Our sync engine saves data locally and uploads to the cloud when you reconnect to 4G or Wi-Fi.',
    color: 'bg-orange-500/10 text-orange-600',
    category: 'Technology'
  },
  {
    icon: Package,
    title: 'Inventory & Stock Alerts',
    description: 'Real-time stock tracking with low-stock SMS/Email alerts. Prevent stockouts before they happen.',
    color: 'bg-indigo-500/10 text-indigo-600',
    category: 'Core'
  },
  {
    icon: Brain,
    title: 'AI Stock Predictions',
    description: 'Machine learning predicts which items will run out based on seasonal trends in your local area.',
    color: 'bg-pink-500/10 text-pink-600',
    category: 'AI'
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Role-based access for cashiers and managers. Track individual sales performance and prevent internal theft.',
    color: 'bg-teal-500/10 text-teal-600',
    category: 'Management'
  },
  {
    icon: FileText,
    title: 'VAT & Tax Compliance',
    description: 'Generate GRA-compliant reports and tax invoices instantly. Export data for easy tax filing.',
    color: 'bg-cyan-500/10 text-cyan-600',
    category: 'Compliance'
  }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 py-1.5 px-4 text-sm bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Built for Ghanaian Retail
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[0.9] tracking-tight">
            The Tools You Need to <br />
            <span className="text-primary italic">Dominate</span> Your Market.
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            We've redesigned the POS from the ground up to solve the unique challenges of merchants in Accra, Kumasi, and beyond.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-16 px-10 text-lg font-bold shadow-xl shadow-primary/20" asChild>
              <Link href="/register">Start Your Free Store</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-semibold border-2" asChild>
              <Link href="/pricing">View GHS Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-10 hover:shadow-2xl transition-all border-none shadow-lg bg-card group relative overflow-hidden">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                
                <Badge variant="secondary" className="mb-4 bg-muted text-muted-foreground border-none">
                  {feature.category}
                </Badge>
                
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MoMo Deep Dive */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black mb-8">Stop chasing agents. <br /><span className="text-primary">Accept MoMo directly.</span></h2>
              <p className="text-xl text-white/70 mb-10 leading-relaxed">
                Our proprietary MoMo API integration eliminates the need for manual agent transfers. Simply enter the customer's number, and they receive a secure payment prompt on their phone instantly.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">MTN, Telecel, AT Money</h4>
                    <p className="text-white/50">Full support for all major Ghanaian networks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Instant Reconcilliation</h4>
                    <p className="text-white/50">Payments are automatically matched to sales in your ledger.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="glass-card p-8 rounded-[2rem] border-white/10 shadow-premium bg-white/5">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Bill</span>
                    <span className="text-2xl font-bold">GHS 450.00</span>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <label className="text-xs font-bold text-primary block mb-2">CUSTOMER PHONE</label>
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-white/40" />
                      <span className="text-xl font-mono tracking-widest">054 123 4567</span>
                    </div>
                  </div>
                  <Button className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90">
                    PUSH MOMO PROMPT
                  </Button>
                  <p className="text-center text-xs text-white/40 italic">Customer will see: "Authorize payment of GHS 450.00 to SwiftPOS?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offline Showcase */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-12">The Offline-First Engine</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Database, title: 'Local Storage', desc: 'Saves every sale to device memory' },
              { icon: RefreshCw, title: 'Auto-Sync', desc: 'Syncs when 4G/Wi-Fi returns' },
              { icon: Shield, title: 'Data Integrity', desc: 'Zero data loss during power cuts' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Works on any tablet or phone' }
            ].map((item, idx) => (
              <div key={idx} className="p-8">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary text-white text-center">
        <h2 className="text-4xl sm:text-6xl font-black mb-8 leading-tight">Ready to upgrade your shop?</h2>
        <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
          Don't wait for another power cut or manual error. Get the POS built for Ghana's future.
        </p>
        <Button size="lg" className="h-16 px-12 text-xl font-black bg-white text-primary hover:bg-white/90 rounded-2xl shadow-2xl" asChild>
          <Link href="/register">Get Started Free</Link>
        </Button>
      </section>

      <Footer />
    </div>
  )
}
