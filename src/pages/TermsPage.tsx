// src/pages/TermsPage.tsx

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#EEF2F7', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px', letterSpacing: '-0.2px' }}>
      {title}
    </h2>
    <div style={{ fontSize: '14px', color: '#8A9BB0', fontFamily: "'Space Grotesk', sans-serif", lineHeight: '1.8' }}>
      {children}
    </div>
  </div>
);

export const TermsPage = () => (
  <div style={{ minHeight: '100vh', background: '#080C10', color: '#EEF2F7', fontFamily: "'Space Grotesk', sans-serif" }}>

    {/* Header bar */}
    <div style={{ borderBottom: '1px solid #1a2535', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#EEF2F7', letterSpacing: '-0.4px' }}>Nessie</span>
        <span style={{ fontSize: '11px', color: '#526478', fontWeight: 500 }}>by Kelpie AI</span>
      </div>
      <a href="/login" style={{ fontSize: '13px', color: '#0ABFA3', textDecoration: 'none', fontWeight: 600 }}>
        Back to app →
      </a>
    </div>

    {/* Content */}
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 32px 80px' }}>

      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ABFA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Legal
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#EEF2F7', margin: '0 0 12px', letterSpacing: '-0.8px' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: '13px', color: '#526478', margin: 0 }}>
          Last updated: 10 April 2026 · Kelpie AI, Falkirk, Scotland
        </p>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Nessie ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.</p>
        <p style={{ marginTop: '10px' }}>These terms constitute a legally binding agreement between you and <strong style={{ color: '#EEF2F7' }}>Kelpie AI</strong>, a company based in Falkirk, Scotland, United Kingdom.</p>
      </Section>

      <Section title="2. What Nessie Does">
        <p>Nessie is a B2B lead research and outreach automation platform. It enables users to:</p>
        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
          {[
            'Search for businesses by industry and location using Google Places',
            'Scrape publicly available information from business websites',
            'Discover business email addresses via Hunter.io',
            'Generate AI-powered personalised outreach messages',
            'Send outreach emails directly from a connected Gmail account',
            'Manage leads, track outreach status, and organise batches',
          ].map((item, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="3. Acceptable Use">
        <p style={{ marginBottom: '12px' }}>You agree to use Nessie only for lawful B2B outreach purposes. Specifically, you agree to:</p>
        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
          {[
            'Only contact businesses and their professional representatives, not private individuals',
            'Comply with all applicable laws including UK GDPR, PECR, and CAN-SPAM',
            'Honour opt-out requests promptly and permanently',
            'Include your identity and a clear opt-out mechanism in all outreach emails',
            'Not send unsolicited emails to individuals who have previously opted out',
            'Not use Nessie to send spam, phishing emails, or any form of fraudulent communication',
          ].map((item, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="4. Prohibited Uses">
        <p style={{ marginBottom: '12px' }}>You must not use Nessie to:</p>
        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
          {[
            'Scrape or contact private individuals (non-business contacts)',
            'Send bulk unsolicited emails (spam)',
            'Conduct phishing, fraud, or any form of deceptive outreach',
            'Violate any third-party terms of service, including Google\'s Terms',
            'Reverse engineer, copy, or redistribute any part of the Nessie platform',
            'Use the platform in a way that damages Kelpie AI\'s reputation or infrastructure',
            'Attempt to gain unauthorised access to other users\' data',
          ].map((item, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
        <p style={{ marginTop: '12px' }}>Violation of these prohibitions may result in immediate account suspension without refund.</p>
      </Section>

      <Section title="5. Your Data">
        <p>You retain ownership of all lead data you generate through Nessie. Kelpie AI does not claim ownership of your leads, email content, or outreach materials.</p>
        <p style={{ marginTop: '10px' }}>You are responsible for ensuring that your use of lead data complies with applicable data protection laws. By using Nessie, you confirm that you have a lawful basis for processing the business contact data you collect.</p>
        <p style={{ marginTop: '10px' }}>You grant Kelpie AI a limited licence to process your data solely for the purpose of delivering the Service.</p>
      </Section>

      <Section title="6. Google Integration">
        <p>By connecting your Gmail account, you authorise Nessie to send emails on your behalf using the Gmail API. You can revoke this access at any time via your <a href="https://myaccount.google.com/permissions" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Google Account settings</a>.</p>
        <p style={{ marginTop: '10px' }}>You are solely responsible for emails sent through your connected Gmail account via Nessie. Kelpie AI is not liable for any consequences arising from outreach emails sent using the Service.</p>
        <p style={{ marginTop: '10px' }}>Your use of Google services through Nessie is also subject to <a href="https://policies.google.com/terms" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Google's Terms of Service</a>.</p>
      </Section>

      <Section title="7. Service Availability">
        <p>Nessie is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted or error-free operation of the Service.</p>
        <p style={{ marginTop: '10px' }}>We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice where possible.</p>
        <p style={{ marginTop: '10px' }}>Third-party API limitations (Google Places, Hunter.io, OpenAI) may affect service availability and results. We are not responsible for changes to third-party APIs that affect the functionality of Nessie.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, Kelpie AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of Nessie, including but not limited to:</p>
        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
          {[
            'Loss of business, revenue, or profits',
            'Failed outreach campaigns or undelivered emails',
            'Data loss or corruption',
            'Third-party claims arising from your use of the Service',
            'Consequences of emails sent through your connected Gmail account',
          ].map((item, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
        <p style={{ marginTop: '12px' }}>Our total liability to you for any claim arising from use of the Service shall not exceed the amount paid by you to Kelpie AI in the 12 months preceding the claim.</p>
      </Section>

      <Section title="9. Account Termination">
        <p>We reserve the right to suspend or terminate your account at any time if you violate these Terms of Service, engage in prohibited uses, or if we reasonably believe your use of the Service poses a legal or reputational risk to Kelpie AI.</p>
        <p style={{ marginTop: '10px' }}>You may request deletion of your account and associated data by contacting <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a>.</p>
      </Section>

      <Section title="10. Governing Law">
        <p>These Terms of Service are governed by and construed in accordance with the laws of Scotland and the United Kingdom. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the Scottish courts.</p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>We may update these Terms of Service from time to time. We will notify users of material changes where possible. Continued use of Nessie after changes constitutes acceptance of the updated terms.</p>
      </Section>

      <Section title="12. Contact">
        <p>For any questions about these Terms of Service:</p>
        <p style={{ marginTop: '10px' }}>
          <strong style={{ color: '#EEF2F7' }}>Kelpie AI</strong><br />
          Falkirk, Scotland, United Kingdom<br />
          <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a>
        </p>
      </Section>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a2535', paddingTop: '24px', display: 'flex', gap: '24px' }}>
        <a href="/privacy" style={{ fontSize: '13px', color: '#0ABFA3', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/login" style={{ fontSize: '13px', color: '#526478', textDecoration: 'none' }}>Back to Nessie</a>
      </div>
    </div>
  </div>
);