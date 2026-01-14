import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare,
  Zap,
  CircleCheck
} from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <MessageSquare className="w-4 h-4 mr-2 inline" />
            We're Here to Help
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get in Touch with SwiftPOS
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Have questions? Need help getting started? Our team is ready to assist you.
            Reach out and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-3">Send us an email anytime</p>
                <a href="mailto:support@swiftpos.com" className="text-primary font-semibold hover:underline">
                  swiftgo40@gmail.com
                </a>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-3">Mon-Fri from 8am to 6pm</p>
                <a href="tel:+233123456789" className="text-primary font-semibold hover:underline">
                  +233 506329180
                </a>
              </Card>

            /*  <Card className="p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                <p className="text-gray-600 mb-3">Come say hello at our office</p>
                <p className="text-gray-700">
                  123 Oxford Street<br />
                  Osu, Accra<br />
                  Ghana
                </p>
              </Card>*/

              <Card className="p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Business Hours</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Monday - Friday:</strong> 8am - 6pm</p>
                  <p><strong>Saturday:</strong> 9am - 3pm</p>
                  <p><strong>Sunday:</strong> Closed</p>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+233 123 456 789"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full text-lg py-6">
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    * Required fields. We typically respond within 24 hours.
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Or Take Action Now</h2>
            <p className="text-xl text-gray-600">
              Start your SwiftPOS journey today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Start Free Trial</h3>
              <p className="text-gray-600 mb-6">
                No credit card required. Get started in minutes.
              </p>
              <Link href="/register">
                <Button className="w-full">Sign Up Free</Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Demo</h3>
              <p className="text-gray-600 mb-6">
                Try SwiftPOS right now with no sign-up.
              </p>
              <Link href="/pos">
                <Button variant="outline" className="w-full">Open Demo</Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CircleCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">View Pricing</h3>
              <p className="text-gray-600 mb-6">
                Simple, transparent pricing plans for all.
              </p>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">See Pricing</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 mb-12">
            Quick answers to common questions
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <Card className="p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold mb-2">How quickly do you respond?</h3>
              <p className="text-gray-600">
                We typically respond to all inquiries within 24 hours during business days.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold mb-2">Do you offer phone support?</h3>
              <p className="text-gray-600">
                Yes! Pro and Business plan customers get priority phone support.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold mb-2">Can I schedule a demo call?</h3>
              <p className="text-gray-600">
                Absolutely! Just mention it in your message and we'll arrange a time.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <h3 className="font-bold mb-2">Do you provide training?</h3>
              <p className="text-gray-600">
                Yes, we offer free onboarding training for all new customers.
              </p>
            </Card>
          </div>

          <div className="mt-12">
            <Link href="/#faq" className="text-primary font-semibold hover:underline">
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
