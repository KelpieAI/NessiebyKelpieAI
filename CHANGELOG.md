🐉 Nessie Changelog
All notable changes to Nessie will be documented in this file.

This project follows semantic versioning during the 0.x development phase:
- MAJOR: structural or architectural changes
- MINOR: new features
- PATCH: bug fixes or polish

## [0.12.0] — Email Tracking & Reply Detection

### ✨ Added
- **Email open tracking** — every email sent through Nessie embeds a 1x1 tracking pixel. Opens are recorded with exact timestamps.
- **Open history timeline** — expand any email in Activities to see every individual open event with date, time and relative time
- **30-second grace period** — prefetch/preview loads by email clients are filtered out and not counted as real opens
- **Reply detection** — Nessie polls Gmail every 30 minutes to check if anyone has replied to a sent email. Replies are detected by thread ID, so no manual input is needed
- **Reply snippets** — the first 300 characters of the reply are saved and shown inside the expanded email row in Activities
- **Replies panel** — right sidebar in Activities shows all leads who have replied at a glance
- **Activities page** — full outreach tracker showing sent emails, open counts, reply status, and batch breakdown with per-batch stats
- **`sent_emails` table** — stores every email sent with full tracking data including open count, reply status, Gmail thread ID
- **`email_opens` table** — stores each individual open event

### 🔧 Improved
- Lead status automatically updates to "replied" when a reply is detected
- send-email Edge Function now saves Gmail thread ID on every send
- Gmail OAuth scope updated to include `gmail.readonly` for reply polling
- Activities filter tabs (All / Opened / Clicked / Replied) now use 
  real `replied` field from `sent_emails` rather than lead status alone

### 🛠 Infrastructure
- New `check-replies` Supabase Edge Function
- New `track-open` Supabase Edge Function  
- Supabase cron job runs `check-replies` every 30 minutes automatically
- `gmail.readonly` scope added to Google OAuth consent screen

---

## [0.11.0] — Google OAuth & Gmail Email Sending

### ✨ Added
- **Google OAuth login** — sign in with your Google account instead of email and password
- **Gmail API integration** — emails sent directly from the user's own Gmail address, not a third-party service
- **Google token storage** — access and refresh tokens saved securely to the user profile and auto-refreshed when expired
- **send-email Edge Function** — handles Gmail API calls and token refresh logic server-side

### 🔧 Improved
- useAuth hook rewritten — eliminated a race condition that caused the infinite loading spinner on page refresh
- Login page updated — Google sign-in button sits above the email/password form
- Netlify deployment fixed — added `_redirects` file for proper SPA routing, site now deploys correctly from master branch

### 🛠 Infrastructure
- Google Cloud OAuth 2.0 client configured with gmail.send scope
- Supabase Site URL updated to nessie.kelpieai.co.uk
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET added as Edge Function secrets
- Custom domain nessie.kelpieai.co.uk live and fully working

---

## [0.10.0] — Lead Finder & Duplicate Detection

### ✨ Added
- **Lead Finder module** — search for businesses by industry and location using Google Places API, no more manual URL hunting
- **Place Details enrichment** — every result automatically gets website and phone number
- **Hunter.io email enrichment** — finds named contacts with job titles and confidence scores
- **Global duplicate detection** — database-level enforcement using a normalised domain index, prevents the same business appearing twice
- **Duplicate UI** — greyed out cards with history modal showing when the lead was added, its status, and options to re-add or view it
- **AppShell layout component** — smooth navigation between pages with no sidebar flash or remounting
- **Unified sidebar** — Lead Finder batches and Scraper batches live in the same place with visual distinction between them
  - **Full CSS design system** — CSS variables for every colour, spacing, radius, and font throughout the entire app. No more hardcoded values
- **Three themes** — Kelpie (dark teal, the signature look), Dark (pure neutral black), and Light mode. Switchable from Settings → Appearance
- **New login page** — pulsing logo ring animation, layered dark background with grid texture and teal glow, proper loading spinner inside the sign-in button
- **Welcome / home screen redesign** — "Ready to Hunt" hero section with the Kelpie horse logo, eyebrow text, and Lead Finder card

### 🔧 Improved
- Lead Finder pipeline moved from Make.com to Supabase Edge Functions
- Scraper and Lead Finder batches share one consistent pipeline
- TopBar — fully rebuilt with proper CSS classes, initials avatar, role badge, and themed dropdown menu
- BatchCard — all hardcoded colours replaced with CSS variables, status pills are now theme-aware
- RightSidebar, HotActivity, QuickNotes — ripped out hardcoded dark colours that were invisible in light mode
- Every component now respects all three themes correctly

---

 [0.9.0] — EU Infrastructure Migration & Platform Upgrade
 🚀 Overview
This release upgrades Nessie's entire backend foundation — migrating all data, auth, and email infrastructure to the **EU (Ireland)** region.  
This prepares Nessie for email sequencing, tracking, GDPR compliance, and future enterprise customers.

 ✨ Improvements
- Migrated Supabase project region → **eu-west-1 (Ireland)**
- Rebuilt Resend domain infrastructure in EU region  
- Standardised DNS records for improved reliability  
- Better deliverability foundation for large-scale sending  
- Reduced latency for UK/EU users  
- Aligned Nessie with GDPR best practices  
- Clean separation of app region, email region, and DNS
- Fixed auth migration issue where NULL token columns caused login failures
- Updated all auth.users string columns to use empty strings instead of NULL
- Resolved "Database error querying schema" error during authentication

 🛠 Internal Updates
- Updated env variables to EU endpoints  
- Prepared EmailService architecture for upcoming sequence engine  
- Start of webhook-ready pipeline for open/click tracking  

---

 [0.8.3] — Email Composer Modal
 ✨ Added
- **Send Email** button added to LeadDetail  
- New **EmailComposer modal** added (UI skeleton ready)  
- Modal accepts lead details and supports draft editing  
- Prepared interface for Resend sending logic  

 🔧 Improved
- LeadDetail layout cleaned up  
- Added lucide-react Send icon  
- Improved component structure for upcoming features  

---

 [0.8.2] — UI Polish & Minor Fixes
 ✨ Improved
- Refined typography and spacing across the app  
- More consistent styling across LeadDetail  
- Sidebar rendering improvements  
- General UX polish  

 🐛 Fixed
- Various component spacing glitches  
- Background inconsistencies across dark theme  

---

 [0.8.1] — Bug Fixes & Stability
 🐛 Fixed
- Lead status update issues  
- Handling leads that had no email/domain values  
- Minor null-safety errors in LeadDetail  
- Improved behaviour for missing icebreaker/message  

---

 [0.8.0] — LeadDetail Overhaul
 ✨ Added
- Complete LeadDetail redesign  
- Tag system (add/remove)  
- Status dropdown with colour coding  
- Lead navigation (Prev/Next buttons)  
- Keyboard navigation (arrow keys)  
- Icebreaker display section  
- Message editor with subject + body  
- Copy-to-clipboard buttons

 🔧 Improved
- Better initial state handling when switching leads  
- Lead summary metadata layout  

---

 [0.7.0] — Queue System
 ✨ Added
- New **Queue** UI  
- Batch list sidebar  
- Lead list view for each batch  
- Initial lead selection + navigation  
- Batch metadata display  

 🔧 Improved
- Jina scraping pipeline integrated more tightly with batches  

---

 [0.6.0] — Early UI + Basic Scraping
 ✨ Added
- Base UI skeleton for Nessie  
- Batch creation page  
- Scraping integration with Jina Reader  
- Domain + metadata detection  

 🔧 Improved
- Updated Supabase tables for leads + batches  

---

 [0.5.4] — Functional Prototype (First Real Version)
 ✨ Added
- Initial working lead scraper  
- Basic batch and lead models  
- Supabase project structure  
- First operational workflow from input → scraped leads

---

 Legend
- **MAJOR**: architecture / breaking changes  
- **MINOR**: features  
- **PATCH**: fixes  

---

## Coming Soon

### Version 1.0 Features

- Privacy Policy and Terms pages
- Custom domain (nessie.kelpieai.co.uk)
- Customer onboarding flow
- Performance optimizations

### Analytics Dashboard

- Total leads processed
- Success rate tracking
- Industry breakdown
- Batch performance comparison
-  Export reports to PDF

### Email Automation

- Gmail and Outlook OAuth integration
- Send emails directly from Nessie
- Automated follow-up sequences
- Email scheduling
- Reply detection

###  Advanced Features

- AI Voice calling integration
- CRM connectors (HubSpot, Salesforce)
- Multi-channel outreach
- White-label branding
- API access
---

## Technology Stack

Frontend: React + TypeScript + Vite
Backend: Supabase (Database, Auth, Edge Functions)
Automation: Make.com
AI Services: OpenAI GPT-4, Jina AI Reader
Email: Hunter.io (discovery), Resend (sending)  
Hosting: EU infrastructure (Dublin, Ireland)
---

## Need Help?

Found a bug? Let us know and we'll fix it  
Feature request? We're always improving Nessie  
Questions? Check out our docs or reach out
---

**Nessie by Kelpie AI**
  
Version 0.11.0.301 - 09 March 2026 
Made in Scotland · Developed by Kelpie AI 🐉






















