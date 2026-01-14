import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
            <p className="text-xl text-gray-600">
              Last updated: December 1, 2024
            </p>
          </div>

          <Card className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <h2>Agreement to Terms</h2>
              <p>
                By accessing or using SwiftPOS, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access the service.
              </p>

              <h2>Description of Service</h2>
              <p>
                SwiftPOS provides a cloud-based point-of-sale platform that includes:
              </p>
              <ul>
                <li>POS terminal for processing sales</li>
                <li>Inventory management system</li>
                <li>Sales analytics and reporting</li>
                <li>Multi-store management capabilities</li>
                <li>Staff and user management</li>
                <li>Offline functionality with automatic synchronization</li>
              </ul>

              <h2>Account Registration</h2>
              <h3>Eligibility</h3>
              <p>
                You must be at least 18 years old and capable of forming a binding contract to use SwiftPOS.
              </p>

              <h3>Account Security</h3>
              <p>
                You are responsible for:
              </p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Ensuring your account information is accurate and up-to-date</li>
              </ul>

              <h2>Acceptable Use</h2>
              <h3>You agree NOT to:</h3>
              <ul>
                <li>Use the service for any illegal purpose or violate any laws</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Upload viruses or malicious code</li>
                <li>Impersonate any person or entity</li>
                <li>Collect or harvest information about other users</li>
                <li>Use the service to transmit spam or unsolicited messages</li>
              </ul>

              <h2>Subscription and Payment</h2>
              <h3>Free Trial</h3>
              <p>
                We offer a 14-day free trial. No credit card is required to start your trial. 
                At the end of the trial, you must subscribe to a paid plan to continue using the service.
              </p>

              <h3>Paid Subscriptions</h3>
              <ul>
                <li>Subscriptions are billed monthly or annually in advance</li>
                <li>Prices are in Ghana Cedis (₵) unless otherwise specified</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change our prices with 30 days' notice</li>
              </ul>

              <h3>Cancellation</h3>
              <p>
                You may cancel your subscription at any time. Cancellation takes effect at the end 
                of your current billing period. You will retain access until that date.
              </p>

              <h2>Data and Privacy</h2>
              <h3>Your Data</h3>
              <p>
                You retain all rights to data you enter into SwiftPOS. We claim no ownership over your content.
              </p>

              <h3>Data Backup</h3>
              <p>
                We perform regular automated backups. However, you are responsible for maintaining 
                your own backup copies of important data.
              </p>

              <h3>Data Security</h3>
              <p>
                We implement industry-standard security measures. However, no system is 100% secure, 
                and we cannot guarantee absolute security.
              </p>

              <h2>Intellectual Property</h2>
              <h3>Our Property</h3>
              <p>
                SwiftPOS and its original content, features, and functionality are owned by us and 
                are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3>Limited License</h3>
              <p>
                We grant you a limited, non-exclusive, non-transferable license to access and use 
                SwiftPOS for your business purposes in accordance with these terms.
              </p>

              <h2>Service Availability</h2>
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted access. We may:
              </p>
              <ul>
                <li>Modify or discontinue features with notice</li>
                <li>Perform scheduled maintenance (with advance notice)</li>
                <li>Temporarily suspend service for emergency maintenance</li>
              </ul>

              <h2>Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law:
              </p>
              <ul>
                <li>SwiftPOS is provided "as is" without warranties of any kind</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid in the last 12 months</li>
                <li>We are not responsible for loss of data, profits, or business interruption</li>
              </ul>

              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless SwiftPOS from any claims, losses, or damages 
                arising from your use of the service or violation of these terms.
              </p>

              <h2>Termination</h2>
              <p>
                We may terminate or suspend your account immediately if you:
              </p>
              <ul>
                <li>Violate these Terms of Service</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Abuse or misuse the service</li>
              </ul>

              <h2>Dispute Resolution</h2>
              <p>
                These terms are governed by the laws of Ghana. Any disputes shall be resolved through:
              </p>
              <ul>
                <li>Good faith negotiation between parties</li>
                <li>Mediation if negotiation fails</li>
                <li>Arbitration in Accra, Ghana (if mediation fails)</li>
              </ul>

              <h2>Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify you of 
                material changes via email or through the service. Continued use after changes 
                constitutes acceptance of the new terms.
              </p>

              <h2>Severability</h2>
              <p>
                If any provision of these terms is found to be unenforceable, the remaining 
                provisions will continue in full force and effect.
              </p>

              <h2>Contact Us</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <ul>
                <li>Email: legal@swiftpos.com</li>
                <li>Address: SwiftPOS Ghana, Accra</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
