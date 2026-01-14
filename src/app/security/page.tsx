import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Shield, Lock, Key, Server, Eye, FileCheck } from 'lucide-react'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Shield className="w-20 h-20 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Security at SwiftPOS</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your business data deserves the highest level of protection. 
              We employ enterprise-grade security measures to keep your information safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <Card className="p-8">
              <Lock className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">End-to-End Encryption</h3>
              <p className="text-gray-600">
                All data transmitted between your devices and our servers is encrypted using 
                industry-standard TLS 1.3 encryption. Your sensitive business data is encrypted 
                at rest using AES-256 encryption.
              </p>
            </Card>

            <Card className="p-8">
              <Key className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Access Control</h3>
              <p className="text-gray-600">
                Role-based access control ensures that team members only see what they need to. 
                Multi-factor authentication adds an extra layer of security to protect your account.
              </p>
            </Card>

            <Card className="p-8">
              <Server className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Secure Infrastructure</h3>
              <p className="text-gray-600">
                We use world-class cloud infrastructure with 99.9% uptime SLA. Our servers are 
                hosted in secure data centers with redundant power, cooling, and network connectivity.
              </p>
            </Card>

            <Card className="p-8">
              <Eye className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Continuous Monitoring</h3>
              <p className="text-gray-600">
                24/7 security monitoring detects and responds to potential threats in real-time. 
                Automated alerts notify our team of any suspicious activity immediately.
              </p>
            </Card>

            <Card className="p-8">
              <FileCheck className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Regular Audits</h3>
              <p className="text-gray-600">
                We conduct regular security audits and penetration testing to identify and fix 
                vulnerabilities. Our code undergoes thorough security reviews before deployment.
              </p>
            </Card>

            <Card className="p-8">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Compliance</h3>
              <p className="text-gray-600">
                We comply with international data protection standards including GDPR. 
                Our security practices meet industry best practices and regulatory requirements.
              </p>
            </Card>
          </div>

          <Card className="p-12 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Data Protection Measures</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Technical Safeguards</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• TLS 1.3 encryption for data in transit</li>
                  <li>• AES-256 encryption for data at rest</li>
                  <li>• Secure password hashing with bcrypt</li>
                  <li>• API rate limiting and DDoS protection</li>
                  <li>• Regular security patches and updates</li>
                  <li>• Secure development lifecycle practices</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Operational Security</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Daily automated backups with encryption</li>
                  <li>• Disaster recovery and business continuity plans</li>
                  <li>• Employee background checks and training</li>
                  <li>• Strict vendor security requirements</li>
                  <li>• Incident response procedures</li>
                  <li>• Regular employee security awareness training</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-12 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Your Responsibilities</h2>
            <p className="text-gray-600 text-center mb-8 text-lg">
              Security is a shared responsibility. Here's how you can help keep your account secure:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Use Strong Passwords</h4>
                  <p className="text-gray-600">
                    Create unique, complex passwords with at least 12 characters including letters, 
                    numbers, and symbols. Never share your password with anyone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Enable Two-Factor Authentication</h4>
                  <p className="text-gray-600">
                    Add an extra layer of security by enabling 2FA in your account settings. 
                    This prevents unauthorized access even if your password is compromised.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Manage User Permissions</h4>
                  <p className="text-gray-600">
                    Only grant necessary permissions to team members. Regularly review and update 
                    access rights, especially when employees leave.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">4</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Keep Software Updated</h4>
                  <p className="text-gray-600">
                    Always use the latest version of your web browser. Enable automatic updates 
                    to ensure you have the latest security patches.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-12 bg-gradient-to-r from-primary to-blue-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Security Questions or Concerns?</h2>
            <p className="text-xl mb-6 text-white/90">
              Our security team is here to help. Report security vulnerabilities or ask questions anytime.
            </p>
            <div className="space-y-2">
              <p className="text-lg">Email: security@swiftpos.com</p>
              <p className="text-sm text-white/70">
                For urgent security issues, please mark your email as [URGENT] in the subject line.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
