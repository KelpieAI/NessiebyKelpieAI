🐉 Nessie Changelog
All notable changes to Nessie will be documented in this file.

This project follows semantic versioning during the 0.x development phase:
- MAJOR: structural or architectural changes
- MINOR: new features
- PATCH: bug fixes or polish

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
  
Version 0.9.0 · 12 December 2025  
100% GDPR Compliant · 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Made in Scotland · 🐉 Developed by Kelpie AI






















