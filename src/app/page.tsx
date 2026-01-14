'use client'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { 
  Zap, Check, Star, Sparkles, ArrowRight, CircleCheck, X,
  TrendingUp, ShieldCheck, Target, BarChart3, Users, 
  Smartphone, Clock, CreditCard, Play, Receipt,
  Bell, FileSpreadsheet, ChevronRight, Calculator,
  SmartphoneNfc, Wallet, History, ArrowUpRight,
  Globe2, ShieldAlert, Cpu, Database, Cloud,
  MessageSquare, Store, ShoppingBag, Scissors,
  Building2, Laptop, Shield, HeartHandshake, Headphones,
  Wifi, Search, Scan, Package, User
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary-foreground font-sans">
      <Navigation />
      
      {/* 1️⃣ HERO SECTION (ABOVE THE FOLD) */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
          {/* Ghana flag inspired subtle accents */}
          <div className="absolute top-[20%] left-[5%] w-32 h-32 bg-yellow-400/10 rounded-full blur-[50px]" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Badge className="py-1.5 px-4 text-sm bg-primary/10 text-primary border-primary/20 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Built for Ghana 🇬🇭
                </Badge>
                <Badge variant="outline" className="px-3 py-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-bold">
                  Works Without Internet 📶
                </Badge>
                <Badge variant="outline" className="px-3 py-1 border-yellow-500/20 bg-yellow-500/5 text-yellow-600 font-bold">
                  Mobile Money First 📱
                </Badge>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[0.9] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                Every Cedi in <br />
                Your Business — <br />
                <span className="text-primary italic">Accounted For.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Sell offline. Accept Mobile Money. Track profit automatically. <br />
                <span className="font-bold text-foreground">Pay only when you sell. We charge you like a partner — not a landlord.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                <Button size="lg" asChild className="text-lg px-8 py-6 h-auto shadow-2xl hover:shadow-primary/40 transition-all hover:scale-[1.02] bg-emerald-600 hover:bg-emerald-700 font-black rounded-2xl">
                  <Link href="/register">
                    Start Free (No Card Required)
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-6 py-6 h-auto border-2 hover:bg-muted font-semibold rounded-2xl">
                  <Link href="#demo">
                    <Play className="mr-2 w-4 h-4 fill-current text-primary" />
                    See How It Works (1 min)
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 animate-in fade-in duration-1000 delay-500 text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <CircleCheck className="w-5 h-5 text-emerald-500" />
                  MoMo Native
                </div>
                <div className="flex items-center gap-2">
                  <CircleCheck className="w-5 h-5 text-emerald-500" />
                  Pay-as-you-sell
                </div>
                <div className="flex items-center gap-2">
                  <CircleCheck className="w-5 h-5 text-emerald-500" />
                  No Internet Required
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative animate-in zoom-in-95 duration-1000 delay-300 w-full max-w-2xl lg:max-w-none">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white/10 glass-card p-2">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/cee1f329-d8f2-4114-bd2e-d8867be44f87/generated_images/professional-modern-pos-point-of-sale-te-7bcd0504-20251202112330.jpg"
                  alt="SwiftPOS Dashboard"
                  width={1000}
                  height={800}
                  className="rounded-[2rem] w-full h-auto object-cover"
                />
              </div>
              
              {/* Floating Trust Cues */}
              <div className="absolute -top-6 -right-6 glass-card p-6 rounded-2xl shadow-2xl animate-bounce-slow z-20 hidden xl:block border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-400/20 rounded-xl">
                    <SmartphoneNfc className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Payments</div>
                    <div className="text-lg font-black">MoMo Integrated</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl shadow-2xl animate-float z-20 hidden xl:block border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Wifi className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Uptime</div>
                    <div className="text-lg font-black italic">Works Offline</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ PAIN & EMPATHY SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">Running a business in Ghana is hard. <br /><span className="text-primary italic">Your POS shouldn't be.</span></h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We know the struggle of manual books, missing cash, and internet outages. SwiftPOS was built to take that weight off your shoulders.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: FileSpreadsheet, 
                title: "Still Using Exercise Books?", 
                desc: "Manual records lead to errors and stress. Ditch the paper—everything is digital, accurate, and backed up.",
                color: "text-red-500",
                bg: "bg-red-50"
              },
              { 
                icon: Wifi, 
                title: "Internet Stopping Sales", 
                desc: "Poor network shouldn't stop your money. SwiftPOS works perfectly even when the internet is down.",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              { 
                icon: ShieldAlert, 
                title: "Staff Mistakes or Theft", 
                desc: "Lose track of cash? SwiftPOS tracks every cedi and staff action so nothing goes missing.",
                color: "text-amber-500",
                bg: "bg-amber-50"
              },
              { 
                icon: TrendingUp, 
                title: "No Real Profit Visibility", 
                desc: "Do you know exactly how much you made today? We calculate your real profit before you sleep.",
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              },
              { 
                icon: CreditCard, 
                title: "Expensive Monthly Fees", 
                desc: "Tired of high monthly subscriptions? Our pay-as-you-sell model grows with your business.",
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              { 
                icon: Smartphone, 
                title: "MoMo Reconciliation", 
                desc: "Manual MoMo verification is slow and risky. Our native API does it for you instantly.",
                color: "text-orange-500",
                bg: "bg-orange-50"
              }
            ].map((item, idx) => (
              <Card key={idx} className={`p-8 border-none shadow-md hover:shadow-2xl transition-all group overflow-hidden relative`}>
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-tl-[5rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3️⃣ SWIFTPOS POSITIONING */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
              <div className="relative z-10 glass-card p-4 rounded-[3rem] border-primary/20 shadow-2xl overflow-hidden group">
                <Image 
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800"
                  alt="Ghanaian Shop"
                  width={800}
                  height={600}
                  className="rounded-[2.5rem] grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute bottom-10 left-10 right-10 p-6 glass-card rounded-2xl border-white/20 bg-black/60 backdrop-blur-xl text-white transform group-hover:translate-y-[-10px] transition-transform">
                  <p className="text-lg font-bold italic">"SwiftPOS was built for how Ghanaian businesses actually operate."</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-10">
              <div>
                <Badge className="mb-6 py-1.5 px-4 text-base font-bold bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">Why SwiftPOS?</Badge>
                <h2 className="text-3xl sm:text-5xl font-black mb-8 leading-[0.9]">Built for Accra, <br /><span className="text-primary">Reliable Everywhere.</span></h2>
              </div>
              
              <div className="grid gap-8">
                {[
                  { title: 'Offline-First Engine', desc: 'Zero internet? No problem. Sales are saved locally and sync automatically when network returns.', icon: Wifi },
                  { title: 'Mobile Money Native', desc: 'Accept MTN, Telecel, and AT Money directly on your POS. No agents, no stress.', icon: SmartphoneNfc },
                  { title: 'Pay-As-You-Sell', desc: 'GHS 5 per day. We only charge you when you make sales. We are your partner, not your landlord.', icon: Calculator },
                  { title: 'Local Support Team', desc: 'A team in Ghana ready to help you on WhatsApp or in person.', icon: MessageSquare }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-start group">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                      <p className="text-muted-foreground text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ FEATURE STORYTELLING (NOT A BORING LIST) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">Built for the <span className="text-primary italic">Daily Hustle</span>.</h2>
          </div>
          
          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h3 className="text-2xl sm:text-4xl font-black mb-8 leading-tight">Sell Offline: Sales continue without internet</h3>
                <p className="text-lg text-white/70 mb-10 leading-relaxed">
                  In the middle of a busy market day, the last thing you need is a network failure. SwiftPOS keeps your business running even when the 4G stops. 
                  Every sale is stored securely and syncs to the cloud the moment you're back online.
                </p>
                <div className="flex items-center gap-4 text-primary font-bold">
                  <Zap className="w-6 h-6 animate-pulse" />
                  <span>Reliable in any location</span>
                </div>
              </div>
              <div className="glass-card p-4 rounded-[2.5rem] border-white/10 bg-white/5 shadow-premium">
                <Image 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                  alt="Market" 
                  width={800} 
                  height={600} 
                  className="rounded-[2rem] opacity-80"
                />
              </div>
            </div>

            {/* Feature 2: MoMo Deep Dive */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="lg:order-2">
                <h3 className="text-3xl sm:text-5xl font-black mb-8 leading-tight">Accept MoMo Directly: No Agents, No Stress</h3>
                <p className="text-xl text-white/70 mb-10 leading-relaxed">
                  Stop asking customers to show their messages. Send a secure USSD prompt directly to their phone. 
                  Once they enter their PIN, the POS updates instantly. It's faster, safer, and 100% accurate.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge className="bg-amber-500 text-black px-4 py-2 text-sm font-black rounded-full">MTN MOMO</Badge>
                  <Badge className="bg-red-600 text-white px-4 py-2 text-sm font-black rounded-full">TELECEL</Badge>
                  <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-black rounded-full">AT MONEY</Badge>
                </div>
              </div>
              <div className="lg:order-1 glass-card p-8 rounded-[3rem] border-white/10 bg-white/5 relative overflow-hidden">
                <div className="space-y-8">
                  <div className="flex justify-between items-center pb-8 border-b border-white/10">
                    <div>
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">POS TRANSACTION</p>
                      <h4 className="text-xl font-bold">New Sale #842</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">TOTAL AMOUNT</p>
                      <p className="text-3xl font-black text-primary">GHS 125.00</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/60 block">1. SELECT NETWORK</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-white/10 border-2 border-primary rounded-2xl flex items-center justify-center">
                        <span className="font-black text-amber-500">MTN</span>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center opacity-50">
                        <span className="font-black">Telecel</span>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center opacity-50">
                        <span className="font-black">AT</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/60 block">2. CUSTOMER PHONE</label>
                    <div className="p-4 bg-black/40 border border-white/10 rounded-2xl text-xl font-mono tracking-[0.1em] text-center text-primary shadow-inner">
                      054 998 7234
                    </div>
                  </div>
                  
                  <Button className="w-full h-16 bg-primary text-white font-black text-lg rounded-xl shadow-xl shadow-primary/40">
                    PUSH MOMO PROMPT
                  </Button>
                  
                  <p className="text-center text-xs text-white/30 italic">Customer will receive: "Authorize payment of GHS 125.00 to SwiftPOS?"</p>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] -z-10" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h3 className="text-3xl sm:text-5xl font-black mb-8 leading-tight">Daily Profit Tracking: Know your profit before sleeping</h3>
                <p className="text-xl text-white/70 mb-10 leading-relaxed">
                  SwiftPOS calculates your real profit by subtracting the cost of goods (COGS) and daily expenses from your total sales. 
                  Know exactly what you earned at the end of every day.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-lg">
                    <div className="text-emerald-500 text-sm font-bold mb-1">Total Sales</div>
                    <div className="text-3xl font-black">GHS 4,500</div>
                  </div>
                  <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl shadow-lg">
                    <div className="text-primary text-sm font-bold mb-1">Net Profit</div>
                    <div className="text-3xl font-black">GHS 1,200</div>
                  </div>
                </div>
              </div>
              <div className="glass-card p-8 rounded-[3rem] border-white/10 bg-white/5">
                <div className="h-64 flex items-end gap-3 px-4">
                  {[40, 65, 45, 90, 75, 55, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-xl transition-all hover:brightness-125 cursor-pointer relative group" style={{ height: `${h}%` }}>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        GHS {h * 50}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-8 px-4 text-[10px] font-black text-white/40 tracking-widest">
                  <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-emerald-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-24 leading-none">Start selling in <br /><span className="italic underline underline-offset-8 decoration-4">3 simple steps</span>.</h2>
          
          <div className="grid md:grid-cols-3 gap-20 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-4 border-dashed border-white/20 -z-0" />
            
            {[
              { step: '01', title: 'Sign up (No Card)', desc: 'Create your account in 30 seconds. No credit card required.', icon: User },
              { step: '02', title: 'Add Products', desc: 'Upload your stock or add items one by one with pricing.', icon: Package },
              { step: '03', title: 'Start Selling', desc: 'Open the POS on any device and start making money.', icon: Zap }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white text-emerald-600 flex items-center justify-center text-3xl font-black mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform cursor-default">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2">Step {item.step}</div>
                <h4 className="text-2xl font-bold mb-4">{item.title}</h4>
                <p className="text-white/80 max-w-xs text-base">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <Button size="lg" className="mt-24 h-16 px-12 text-xl font-black bg-white text-emerald-600 hover:bg-white/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:scale-105" asChild>
            <Link href="/register">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* 6️⃣ BUSINESS TYPES SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 py-1.5 px-4 border-primary text-primary font-black uppercase tracking-widest">Built for Everyone</Badge>
            <h2 className="text-3xl sm:text-5xl font-black mb-6">Who is SwiftPOS for?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From market kiosks to multi-branch supermarkets.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShoppingBag, title: "Retail Shops", solution: "Stop losing track of stock. SwiftPOS handles thousands of items with ease.", tag: "Boutiques & Tech", color: "bg-blue-50 text-blue-600" },
              { icon: Scissors, title: "Salons & Barbers", solution: "Track service sales and tips. Manage your staff performance effortlessly.", tag: "Beauty & Spa", color: "bg-purple-50 text-purple-600" },
              { icon: Store, title: "Provision Stores", solution: "Fastest checkout for your customers. Works offline during power cuts.", tag: "Markets & Kiosks", color: "bg-emerald-50 text-emerald-600" },
              { icon: Building2, title: "Multi-branch", solution: "See all your shops in one place. Monitor growth from anywhere.", tag: "Growing SMEs", color: "bg-amber-50 text-amber-600" }
            ].map((item, idx) => (
              <Card key={idx} className="p-8 border-2 border-transparent hover:border-primary/20 transition-all group h-full flex flex-col shadow-xl hover:shadow-2xl rounded-[2rem] relative overflow-hidden">
                <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <Badge variant="secondary" className="mb-4 w-fit bg-muted text-muted-foreground font-bold rounded-full px-3 text-[10px]">{item.tag}</Badge>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-muted-foreground flex-1 leading-relaxed text-base">{item.solution}</p>
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${item.color.split(' ')[0]} opacity-5 rounded-full -z-0`} />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7️⃣ PRICING PREVIEW */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-emerald-500 to-yellow-500" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl sm:text-5xl font-black mb-8 leading-tight tracking-tighter">SwiftPOS charges you <br />like a <span className="text-primary italic">partner</span> — <span className="text-white/40">not a landlord.</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Forever */}
            <Card className="p-8 bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col rounded-[2.5rem]">
              <div className="mb-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Free Forever</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">BEST FOR NEW SHOPS</p>
                <div className="mt-6 text-5xl font-black tracking-tighter">GHS 0</div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Single Device', 'Up to 50 Products', 'Cash Sales Only', 'Standard Support'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-14 text-lg font-black border-white/20 hover:bg-white hover:text-black rounded-xl transition-all" asChild>
                <Link href="/register">Start Free</Link>
              </Button>
            </Card>

            {/* Pay-As-You-Sell */}
            <Card className="p-8 bg-primary border-primary relative shadow-[0_30px_100px_rgba(59,130,246,0.3)] z-20 flex flex-col rounded-[2.5rem] overflow-hidden lg:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/20" />
              <Badge className="absolute top-4 right-6 bg-white text-primary px-3 py-0.5 text-[8px] font-black shadow-xl rounded-full">RECOMMENDED</Badge>
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-black text-white mb-2">Pay-As-You-Sell</h3>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">ONLY PAY WHEN YOU SELL</p>
                <div className="mt-6 text-6xl font-black tracking-tighter text-white">GHS 5<span className="text-xl font-medium opacity-60">/day</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unlimited Products',
                  'Native MoMo APIs',
                  '100% Offline Syncing',
                  'Debt & Credit Tracking',
                  'WhatsApp Receipts'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full h-16 text-xl font-black bg-white text-primary hover:bg-white/90 shadow-[0_15px_30px_rgba(0,0,0,0.2)] rounded-2xl transition-all hover:scale-[1.02]" asChild>
                <Link href="/register">Get the POS</Link>
              </Button>
            </Card>

            {/* Business Plan */}
            <Card className="p-8 bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col rounded-[2.5rem]">
              <div className="mb-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Business Plan</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">FOR ESTABLISHED SMEs</p>
                <div className="mt-6 text-5xl font-black tracking-tighter">GHS 120<span className="text-xl font-medium opacity-40">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Pay-As-You-Sell', 'Multi-user Access', 'Advanced Inventory', 'Multi-Store Reports', 'Priority Support'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-14 text-lg font-black border-white/20 hover:bg-white hover:text-black rounded-xl transition-all" asChild>
                <Link href="/register">Scale Up</Link>
              </Button>
            </Card>
          </div>
          
          <div className="mt-16 text-center">
            <Button variant="link" className="text-white/40 hover:text-white font-black text-lg underline underline-offset-8 transition-colors" asChild>
              <Link href="/pricing">View full pricing details →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 8️⃣ COMPARISON SNAPSHOT */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-6 italic text-primary">SwiftPOS <span className="text-foreground not-italic">vs</span> The Others</h2>
            <p className="text-muted-foreground text-lg">Why Ghanaian shops are making the switch.</p>
          </div>
          
          <div className="overflow-x-auto rounded-[2rem] border border-border shadow-premium bg-card">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-6 font-black text-xl">Feature</th>
                  <th className="p-6 font-black text-xl text-primary text-center">SwiftPOS</th>
                  <th className="p-6 font-bold text-lg opacity-40 text-center">International POS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: 'Works 100% Offline', swift: true, others: false },
                  { feature: 'Native MoMo (MTN/Telecel)', swift: true, others: false },
                  { feature: 'Pay-As-You-Sell Pricing', swift: true, others: false },
                  { feature: 'Customer Debt Ledger', swift: true, others: false },
                  { feature: 'WhatsApp Receipts', swift: true, others: false },
                  { feature: 'Local Ghana Support', swift: true, others: false }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-6 font-bold text-lg group-hover:text-primary transition-colors">{row.feature}</td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                          <Check className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center opacity-40">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <X className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 9️⃣ TRUST & SUPPORT */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black mb-12 leading-[0.9] tracking-tighter">We are with you every <span className="text-primary italic underline underline-offset-8">step</span> of the way.</h2>
              <div className="grid gap-8">
                <div className="flex gap-6 group">
                  <div className="p-5 bg-white rounded-2xl shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">WhatsApp Support</h4>
                    <p className="text-muted-foreground text-lg leading-relaxed">Message us anytime. Our local team understands your business and your language.</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="p-5 bg-white rounded-2xl shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Data Security</h4>
                    <p className="text-muted-foreground text-lg leading-relaxed">Your sales data is encrypted and backed up daily. It belongs to you alone.</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="p-5 bg-white rounded-2xl shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                    <HeartHandshake className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Ghana-Based Team</h4>
                    <p className="text-muted-foreground text-lg leading-relaxed">We are located in Accra. We visit markets and shops to build what you actually need.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-premium border border-border relative overflow-hidden">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Headphones className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Need a Demo?</h3>
                    <p className="text-muted-foreground text-base">Book a free demo for your shop.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Store className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Your Shop Name" className="w-full h-16 pl-14 pr-6 rounded-xl bg-muted border-none font-bold text-lg outline-none focus:ring-4 ring-primary/20 transition-all" />
                  </div>
                  <div className="relative">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="tel" placeholder="Phone Number (WhatsApp)" className="w-full h-16 pl-14 pr-6 rounded-xl bg-muted border-none font-bold text-lg outline-none focus:ring-4 ring-primary/20 transition-all" />
                  </div>
                  <Button className="w-full h-16 bg-primary text-white font-black text-xl rounded-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]">
                    Book Demo Now
                  </Button>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-primary font-black text-xl tracking-tighter">+233 (0) 54 123 4567</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔟 FINAL CTA (STRONG CLOSE) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-7xl font-black mb-12 leading-[0.8] tracking-tighter">
            Stop <span className="text-white/20">guessing.</span> <br />
            Start <span className="text-primary italic">knowing.</span>
          </h2>
          <p className="text-lg sm:text-2xl text-white/70 mb-16 max-w-3xl mx-auto font-medium leading-relaxed">
            The era of manual books and missing cash is over. Take control of your business and start growing today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" className="h-20 px-12 text-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 group" asChild>
              <Link href="/register">
                Start Free Today
                <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-20 px-12 text-2xl font-black border-white/20 hover:bg-white hover:text-black rounded-2xl transition-all hover:scale-105 active:scale-95" asChild>
              <Link href="https://wa.me/233506329180" target="_blank">
                <MessageSquare className="mr-4 w-6 h-6" />
                Chat on WhatsApp
              </Link>
            </Button>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/40 font-black tracking-widest uppercase text-[10px]">
            <span className="flex items-center gap-2"><Check className="w-3 h-3" /> No Credit Card Required</span>
            <span className="flex items-center gap-2"><Check className="w-3 h-3" /> Set up in 2 minutes</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
