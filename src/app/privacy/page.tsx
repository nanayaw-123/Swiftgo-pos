import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl text-gray-600">
              Last updated: December 1, 2024
            </p>
          </div>

          <Card className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <h2>Introduction</h2>
              <p>
                At SwiftPOS, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our point-of-sale platform.
              </p>

              <h2>Information We Collect</h2>
              <h3>Personal Information</h3>
              <p>
                We collect information that you provide directly to us, including:
              </p>
              <ul>
                <li>Name, email address, and contact information</li>
                <li>Business information (company name, location, tax ID)</li>
                <li>Payment information (processed securely through our payment providers)</li>
                <li>Account credentials and preferences</li>
              </ul>

              <h3>Business Data</h3>
              <p>
                When you use SwiftPOS, we collect and store:
              </p>
              <ul>
                <li>Product inventory and pricing information</li>
                <li>Sales transactions and customer data</li>
                <li>Staff and user management data</li>
                <li>Business analytics and reporting data</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>
                We automatically collect certain information when you use our services:
              </p>
              <ul>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (features used, time spent, interactions)</li>
                <li>Location data (if you enable location services)</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize our platform</li>
                <li>Detect, prevent, and address fraud and security issues</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul>
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure cloud infrastructure with regular backups</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security audits and updates</li>
              </ul>

              <h2>Data Sharing and Disclosure</h2>
              <p>
                We do not sell your personal information. We may share your information only in these circumstances:
              </p>
              <ul>
                <li>With your consent or at your direction</li>
                <li>With service providers who assist our operations (under strict confidentiality agreements)</li>
                <li>To comply with legal obligations or protect rights and safety</li>
                <li>In connection with a merger, sale, or business transfer</li>
              </ul>

              <h2>Your Data Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul>
                <li>Access and download your data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Object to or restrict certain processing</li>
                <li>Export your data to another service</li>
              </ul>

              <h2>Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                When you delete your account, we will delete or anonymize your data within 30 days, 
                except where we must retain it for legal or compliance purposes.
              </p>

              <h2>International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this policy.
              </p>

              <h2>Children's Privacy</h2>
              <p>
                SwiftPOS is not intended for users under 18 years of age. We do not knowingly collect 
                information from children under 18.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@swiftpos.com</li>
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
