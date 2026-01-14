import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BlogPage() {
  const posts = [
    {
      title: '5 Ways to Improve Your Shop\'s Inventory Management',
      excerpt: 'Learn practical strategies to reduce stockouts and overselling while maximizing profits.',
      category: 'Inventory',
      date: 'Nov 28, 2024',
      author: 'Sarah Johnson',
      readTime: '5 min read'
    },
    {
      title: 'The Ultimate Guide to Setting Up Your First POS System',
      excerpt: 'Everything you need to know about choosing and implementing a POS system for your business.',
      category: 'Getting Started',
      date: 'Nov 25, 2024',
      author: 'Michael Chen',
      readTime: '8 min read'
    },
    {
      title: 'How to Increase Sales Using Customer Data',
      excerpt: 'Discover how to leverage your POS data to understand customer behavior and boost revenue.',
      category: 'Sales',
      date: 'Nov 22, 2024',
      author: 'Akosua Mensah',
      readTime: '6 min read'
    },
    {
      title: 'Why Offline Mode is Critical for African Businesses',
      excerpt: 'Understanding the importance of offline POS capabilities in markets with unreliable internet.',
      category: 'Features',
      date: 'Nov 20, 2024',
      author: 'Kwame Osei',
      readTime: '4 min read'
    },
    {
      title: 'Managing Multiple Store Locations Efficiently',
      excerpt: 'Best practices for overseeing inventory, staff, and sales across multiple retail locations.',
      category: 'Multi-store',
      date: 'Nov 18, 2024',
      author: 'Esi Agyeman',
      readTime: '7 min read'
    },
    {
      title: 'Understanding Your Business Metrics: A Complete Guide',
      excerpt: 'Learn which KPIs matter most and how to use analytics to make better business decisions.',
      category: 'Analytics',
      date: 'Nov 15, 2024',
      author: 'David Asante',
      readTime: '9 min read'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">SwiftPOS Blog</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tips, guides, and insights to help you grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all group cursor-pointer">
                <Badge variant="secondary" className="mb-4">{post.category}</Badge>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Want to stay updated?</p>
            <Link href="/contact">
              <Button size="lg">Subscribe to Newsletter</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
