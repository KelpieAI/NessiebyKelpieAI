// src/pages/PrivacyPage.tsx

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

export const PrivacyPage = () => (
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '13px', color: '#526478', margin: 0 }}>
          Last updated: 10 April 2026 · Kelpie AI, Falkirk, Scotland
        </p>
      </div>

      <Section title="1. Who We Are">
        <p>Nessie is a lead research and outreach automation platform operated by <strong style={{ color: '#EEF2F7' }}>Kelpie AI</strong>, a software company based in Falkirk, Scotland, United Kingdom.</p>
        <p style={{ marginTop: '10px' }}>For any data protection enquiries, contact us at: <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a></p>
        <p style={{ marginTop: '10px' }}>Kelpie AI is the data controller for all personal data processed through Nessie.</p>
      </Section>

      <Section title="2. What Data We Collect">
        <p style={{ marginBottom: '12px' }}>Nessie collects and processes the following categories of data:</p>
        <p><strong style={{ color: '#EEF2F7' }}>Account data</strong> — when you sign in with Google, we receive your name, email address, and profile picture from Google. We store your Google OAuth tokens to enable email sending on your behalf.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Lead data</strong> — Nessie processes publicly available business information including company names, website URLs, business email addresses, phone numbers, industry classification, and AI-generated outreach content.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Usage data</strong> — we log batch processing activity, scrape outcomes, and lead statuses to power analytics and improve the platform.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Email activity</strong> — emails sent through Nessie are logged with recipient address, subject line, timestamp, and delivery status.</p>
      </Section>

      <Section title="3. Why We Process This Data">
        <p style={{ marginBottom: '12px' }}>We process data under the following legal bases under UK GDPR:</p>
        <p><strong style={{ color: '#EEF2F7' }}>Legitimate interests</strong> — processing publicly available business contact information for B2B outreach purposes. We only process data relating to businesses and their representatives, not private individuals.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Contract performance</strong> — processing your account data to provide the Nessie service you have signed up for.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Consent</strong> — when you sign in with Google and grant Gmail access, you explicitly consent to Nessie sending emails on your behalf using your Gmail account.</p>
      </Section>

      <Section title="4. Third-Party Services">
        <p style={{ marginBottom: '12px' }}>Nessie uses the following third-party services to operate:</p>
        <p><strong style={{ color: '#EEF2F7' }}>Supabase</strong> — our database and authentication provider. All data is stored in EU infrastructure (Ireland). <a href="https://supabase.com/privacy" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Supabase Privacy Policy</a></p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Google</strong> — used for authentication and Gmail sending via OAuth 2.0. <a href="https://policies.google.com/privacy" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Google Privacy Policy</a></p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Hunter.io</strong> — used to discover business email addresses from company websites. <a href="https://hunter.io/privacy" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Hunter.io Privacy Policy</a></p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>Jina AI</strong> — used to scrape and extract content from publicly accessible websites.</p>
        <p style={{ marginTop: '10px' }}><strong style={{ color: '#EEF2F7' }}>OpenAI</strong> — used to generate personalised outreach content from scraped business data. <a href="https://openai.com/policies/privacy-policy" style={{ color: '#0ABFA3', textDecoration: 'none' }}>OpenAI Privacy Policy</a></p>
        <p style={{ marginTop: '10px' }}>We do not sell your data to any third party, and none of the above providers are permitted to use your data for their own marketing purposes.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Lead data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us at <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a>.</p>
        <p style={{ marginTop: '10px' }}>Google OAuth tokens are stored securely and are used solely to send emails on your behalf. You can revoke Nessie's access to your Gmail at any time via your <a href="https://myaccount.google.com/permissions" style={{ color: '#0ABFA3', textDecoration: 'none' }}>Google Account settings</a>.</p>
      </Section>

      <Section title="6. Your Rights Under UK GDPR">
        <p style={{ marginBottom: '12px' }}>As a data subject under UK GDPR, you have the right to:</p>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {[
            'Access the personal data we hold about you',
            'Rectify inaccurate personal data',
            'Request erasure of your personal data',
            'Object to processing based on legitimate interests',
            'Restrict processing of your data',
            'Data portability — receive your data in a structured, machine-readable format',
            'Lodge a complaint with the Information Commissioner\'s Office (ICO)',
          ].map((right, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{right}</li>
          ))}
        </ul>
        <p style={{ marginTop: '12px' }}>To exercise any of these rights, contact us at <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="7. Security">
        <p>All data is stored in EU-hosted infrastructure and encrypted at rest. Access to your data is restricted to authorised Kelpie AI personnel only. We use row-level security to ensure users can only access their own data within Nessie.</p>
        <p style={{ marginTop: '10px' }}>OAuth tokens are stored securely in our database and are never exposed to the client.</p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. When we do, we will update the date at the top of this page. Continued use of Nessie after changes constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="9. Contact">
        <p>For any privacy-related questions or requests:</p>
        <p style={{ marginTop: '10px' }}>
          <strong style={{ color: '#EEF2F7' }}>Kelpie AI</strong><br />
          Falkirk, Scotland, United Kingdom<br />
          <a href="mailto:sami.mustafa@kelpieai.co.uk" style={{ color: '#0ABFA3', textDecoration: 'none' }}>sami.mustafa@kelpieai.co.uk</a>
        </p>
      </Section>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a2535', paddingTop: '24px', display: 'flex', gap: '24px' }}>
        <a href="/terms" style={{ fontSize: '13px', color: '#0ABFA3', textDecoration: 'none' }}>Terms of Service</a>
        <a href="/login" style={{ fontSize: '13px', color: '#526478', textDecoration: 'none' }}>Back to Nessie</a>
      </div>
    </div>
  </div>
);