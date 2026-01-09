/**
 * @fileoverview Privacy Policy page.
 * Displays the privacy policy and data handling practices.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Account Information:</strong> When you create an account, we collect your email address, name, and password (or authentication tokens for social login).</li>
                <li><strong>Profile Information:</strong> Any additional information you choose to provide, such as display name, avatar, and bio.</li>
                <li><strong>Usage Data:</strong> Information about your interactions with the service, including prompts created, tests run, and features used.</li>
                <li><strong>Device Information:</strong> Information about the device you use to access the service, including IP address, browser type, and operating system.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services.</li>
                <li>Process and complete transactions.</li>
                <li>Send you technical notices, updates, security alerts, and support messages.</li>
                <li>Respond to your comments, questions, and requests.</li>
                <li>Monitor and analyze trends, usage, and activities.</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Social Login and Third-Party Authentication</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you choose to sign in using a social login provider (such as Google, GitHub, Microsoft, or Apple), we receive certain information from that provider, which may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your name and email address associated with that account.</li>
                <li>Your profile picture (if publicly available).</li>
                <li>A unique identifier for your account with that provider.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not receive or store your password from social login providers. The authentication is handled securely by the provider.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Service Providers:</strong> We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition.</li>
                <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption of data in transit and at rest.</li>
                <li>Regular security assessments and audits.</li>
                <li>Access controls and authentication mechanisms.</li>
                <li>Secure development practices.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You can request that we correct any inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> You can request that we delete your personal information.</li>
                <li><strong>Portability:</strong> You can request a copy of your data in a machine-readable format.</li>
                <li><strong>Objection:</strong> You can object to certain processing of your personal information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to collect and use personal information about you. Cookies are small data files stored on your device that help us improve our service and your experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us through our support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
