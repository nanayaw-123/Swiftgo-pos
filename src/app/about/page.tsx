'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, 
  Target, 
  Award, 
  Heart,
  Zap,
  Globe,
  TrendingUp,
  Shield,
  Sparkles,
  CircleCheck,
  ArrowRight
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - Premium Design */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-electric/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-primary/10 to-electric/10 border border-primary/20">
              <Heart className="w-4 h-4 mr-2 inline text-primary" />
              Our Story
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-[1.1] animate-fade-in-up">
              <span className="block mb-2">Built for African</span>
              <span className="block gradient-text">Businesses</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed animate-fade-in-up stagger-1">
              We're on a mission to democratize technology and empower every shop owner 
              with professional-grade business tools that drive real growth.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Premium Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card className="p-8 sm:p-10 hover:shadow-premium transition-all group glass-card">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-electric rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To provide every shop owner in Africa with professional-grade business tools 
                that were once only accessible to large corporations. We believe in democratizing 
                technology and making powerful POS systems <span className="font-semibold text-foreground">affordable, reliable, and easy to use</span>.
              </p>
            </Card>

            <Card className="p-8 sm:p-10 hover:shadow-premium transition-all group glass-card border-2 border-primary/20">
              <div className="w-16 h-16 bg-gradient-to-br from-neon to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We're committed to <span className="font-semibold text-foreground">simplicity, reliability, and customer success</span>. 
                Every feature we build is designed with the real needs of African businesses in mind, 
                from offline capabilities to local payment integrations.
              </p>
            </Card>
          </div>

          {/* Why We Built This */}
          <Card className="p-10 sm:p-12 bg-gradient-to-br from-primary/5 via-electric/5 to-neon/5 border-2 border-primary/10">
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why We Built SwiftPOS</h2>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto text-center">
              We saw firsthand how shop owners struggled with <span className="font-semibold text-foreground">manual processes, lost inventory, 
              and lack of business insights</span>. Traditional POS systems were either too expensive, too complicated, 
              or simply not designed for African markets. SwiftPOS was born from the desire to solve these 
              real problems with modern, accessible technology.
            </p>
          </Card>
        </div>
      </section>

      {/* Stats Section - Premium Design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Our Impact</h2>
            <p className="text-xl text-muted-foreground">
              Real numbers from real businesses
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: '3,200+', label: 'Happy Customers', icon: Users, color: 'from-primary to-electric' },
              { value: '5+ Years', label: 'Industry Experience', icon: Award, color: 'from-green-500 to-emerald-600' },
              { value: '100%', label: 'Customer Focused', icon: Target, color: 'from-purple-500 to-pink-600' },
              { value: '25%', label: 'Average Growth', icon: TrendingUp, color: 'from-orange-500 to-red-600' }
            ].map((stat, idx) => (
              <Card key={idx} className="p-6 sm:p-8 text-center hover:shadow-premium transition-all group cursor-pointer">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              What Makes Us Different
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Built Differently</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're not just another POS system. We're your growth partner.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Africa-First Design',
                desc: 'Built specifically for African markets with offline mode, mobile money, and unstable internet support.'
              },
              {
                icon: Zap,
                title: 'AI-Powered Intelligence',
                desc: 'Smart predictions, fraud detection, and automated insights that competitors don\'t offer.'
              },
              {
                icon: Shield,
                title: 'No Hardware Lock-in',
                desc: 'Use any device, any scanner, any printer. You own your business, not us.'
              }
            ].map((feature, idx) => (
              <Card key={idx} className="p-8 hover:shadow-premium transition-all group">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-all" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Customer Success First', desc: 'Your growth is our success. Every decision starts with "How does this help our customers?"' },
              { title: 'Simplicity Always Wins', desc: 'Complex problems deserve simple solutions. We obsess over making things easy to use.' },
              { title: 'Build for Africa', desc: 'Understanding local challenges isn\'t optional—it\'s core to everything we design.' },
              { title: 'Move Fast, Stay Stable', desc: 'Innovation with reliability. We ship features quickly without breaking what works.' },
              { title: 'Transparent & Honest', desc: 'No hidden fees, no surprises, no marketing tricks. Just honest business.' },
              { title: 'Community Driven', desc: 'We listen to feedback, respond to requests, and grow with our community.' }
            ].map((value, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all border-l-4 border-primary">
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-electric to-neon text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Sparkles className="w-16 h-16 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Join 3,200+ Businesses Growing with SwiftPOS
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Start your free trial today. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-7 shadow-2xl hover:scale-105 transition-all">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur">
                <Users className="w-5 h-5 mr-2" />
                Talk to Our Team
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center">
              <CircleCheck className="w-4 h-4 mr-1" />
              14-day free trial
            </span>
            <span className="flex items-center">
              <CircleCheck className="w-4 h-4 mr-1" />
              No credit card required
            </span>
            <span className="flex items-center">
              <CircleCheck className="w-4 h-4 mr-1" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}