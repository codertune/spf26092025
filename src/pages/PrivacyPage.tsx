import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your privacy and data security are our top priorities. Learn how we protect and handle your information.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Last updated: December 20, 2024</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Eye className="h-6 w-6 text-blue-600 mr-3" />
            Privacy at a Glance
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Lock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Encrypted Processing</h3>
              <p className="text-sm text-gray-600">All data is encrypted during transmission and processing</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No Data Storage</h3>
              <p className="text-sm text-gray-600">Files are deleted immediately after processing</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">GDPR Compliant</h3>
              <p className="text-sm text-gray-600">Full compliance with international privacy standards</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              Information We Collect
            </h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                <li>Name and email address for account creation</li>
                <li>Company name and contact information</li>
                <li>Payment information processed securely through bKash</li>
                <li>Usage statistics and service preferences</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">File Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                <li>Documents uploaded for processing (PDF, Excel, CSV)</li>
                <li>Metadata such as file size, type, and processing requirements</li>
                <li>Processing logs for quality assurance and debugging</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>IP address and browser information</li>
                <li>Device type and operating system</li>
                <li>Usage patterns and feature interactions</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="prose prose-gray max-w-none">
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li><strong>Service Delivery:</strong> Process your documents and provide automation services</li>
                <li><strong>Account Management:</strong> Maintain your account, process payments, and provide support</li>
                <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance our platform</li>
                <li><strong>Communication:</strong> Send service updates, security alerts, and support messages</li>
                <li><strong>Compliance:</strong> Meet legal and regulatory requirements</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <div className="prose prose-gray max-w-none">
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Our Security Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-800">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Secure processing environments with isolated containers</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Automatic file deletion after processing completion</li>
                </ul>
              </div>
              
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your data. All files are processed in secure, 
                isolated environments and are permanently deleted within 24 hours of processing completion.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <div className="prose prose-gray max-w-none">
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Our Retention Policy</h3>
                <ul className="list-disc pl-6 space-y-2 text-green-800">
                  <li><strong>Uploaded Files:</strong> Deleted immediately after processing (max 24 hours)</li>
                  <li><strong>Processing Results:</strong> Available for download for 7 days, then deleted</li>
                  <li><strong>Account Data:</strong> Retained while account is active</li>
                  <li><strong>Payment Records:</strong> Kept for 7 years for tax and legal compliance</li>
                  <li><strong>Usage Logs:</strong> Anonymized and retained for 90 days for service improvement</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Under GDPR and other privacy laws, you have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Restriction:</strong> Request limitation of data processing</li>
              </ul>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  To exercise any of these rights, please contact us at 
                  <a href="mailto:privacy@smartprocessflow.com" className="text-blue-600 hover:text-blue-800 ml-1">
                    privacy@smartprocessflow.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We use the following third-party services that may process your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li><strong>bKash:</strong> Payment processing (subject to bKash privacy policy)</li>
                <li><strong>Cloud Infrastructure:</strong> Secure hosting and processing services</li>
                <li><strong>Analytics:</strong> Anonymized usage analytics for service improvement</li>
                <li><strong>Support Tools:</strong> Customer support and communication platforms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Transfers</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Your data may be processed in countries outside Bangladesh. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Standard contractual clauses approved by data protection authorities</li>
                <li>Adequacy decisions by relevant data protection authorities</li>
                <li>Certification schemes and codes of conduct</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We may update this privacy policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                <li>Email notification to your registered email address</li>
                <li>Prominent notice on our website</li>
                <li>In-app notifications when you next use our services</li>
              </ul>
              
              <p className="text-gray-600">
                Continued use of our services after changes become effective constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@smartprocessflow.com</p>
                  <p><strong>Phone:</strong> +880 1234-567890</p>
                  <p><strong>Address:</strong> Dhaka, Bangladesh</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}