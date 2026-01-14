import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Clock, Heart, Users, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function CareersPage() {
  const positions = [
    {
      title: 'Senior Full-Stack Engineer',
      location: 'Accra, Ghana / Remote',
      type: 'Full-time',
      department: 'Engineering',
      description: 'Build and scale our core POS platform using Next.js, TypeScript, and modern cloud infrastructure.'
    },
    {
      title: 'Product Designer',
      location: 'Remote',
      type: 'Full-time',
      department: 'Design',
      description: 'Design beautiful, intuitive interfaces that delight shop owners across Africa.'
    },
    {
      title: 'Customer Success Manager',
      location: 'Accra, Ghana',
      type: 'Full-time',
      department: 'Customer Success',
      description: 'Help our customers succeed by providing exceptional support and guidance.'
    },
    {
      title: 'Sales Development Representative',
      location: 'Kumasi, Ghana',
      type: 'Full-time',
      department: 'Sales',
      description: 'Connect with businesses and help them discover how SwiftPOS can transform their operations.'
    }
  ]

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance for you and your family'
    },
    {
      icon: Users,
      title: 'Remote-First',
      description: 'Work from anywhere with flexible hours'
    },
    {
      icon: Rocket,
      title: 'Growth & Learning',
      description: 'Annual learning budget and conference attendance'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Help us build the future of retail technology in Africa. 
              We're looking for passionate people who want to make a real impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 text-center">
                <benefit.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </Card>
            ))}
          </div>

          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-center">Open Positions</h2>
            <div className="space-y-6">
              {positions.map((position, index) => (
                <Card key={index} className="p-8 hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">{position.title}</h3>
                        <Badge>{position.department}</Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{position.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{position.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{position.department}</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/contact">
                      <Button size="lg">Apply Now</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-12 bg-gradient-to-r from-primary to-blue-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Don't see a perfect fit?</h2>
            <p className="text-xl mb-6 text-white/90">
              We're always looking for talented people. Send us your resume and let us know how you can contribute.
            </p>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Get in Touch
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
