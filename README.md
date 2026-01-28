# Nessie - AI-Powered Lead Research & Outreach Automation

**Automated lead qualification and personalised outreach generation platform**

---

## Overview

Nessie automates the lead research and outreach workflow for B2B sales and marketing teams. The platform processes company websites in bulk, extracting business intelligence, discovering verified contact details, and generating personalised outreach content using AI.

**Problem Statement:** Manual lead research is time-intensive and produces inconsistent results. Sales teams spend hours per prospect researching companies, locating decision-makers, and crafting personalised messages.

**Solution:** Nessie reduces lead qualification from hours to seconds whilst maintaining personalisation quality. The system analyses company websites, identifies appropriate contacts, and generates contextually relevant outreach messages tailored to each prospect's business.

---

## Key Features

### Core Functionality
- **Bulk URL Processing** - CSV upload or manual input for batch processing
- **Intelligent Web Scraping** - Extracts business information, services offered, and industry classification
- **Email Discovery** - Finds and verifies contact emails with smart filtering (excludes generic addresses)
- **AI-Generated Content** - Creates personalised icebreakers and outreach messages for each prospect
- **Multi-Channel Support** - Generates content optimised for Email, LinkedIn, and Facebook outreach
- **Batch Management** - Organise leads into labelled batches with custom templates and tracking
- **Real-Time Processing** - Live status updates and progress monitoring during batch execution

### Technical Features
- **Multi-User Authentication** - Secure login with row-level security (RLS) for data isolation
- **GDPR Compliance** - EU-hosted infrastructure with proper data handling
- **Batch Controls** - Stop and resume processing without data loss
- **Error Handling** - Failed scrapes logged separately without breaking batch execution
- **Webhook Security** - Token-based verification for all external communications

---

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS
- Vite
- Supabase Client (real-time subscriptions and authentication)

### Backend
- Supabase (PostgreSQL)
  - Tables: `batches`, `leads`, `successful_leads`, `failed_scrapes`, `profiles`
  - Row Level Security policies
  - Real-time subscriptions
  - User authentication

### Automation & Integration
- Make.com - Workflow orchestration
- Jina AI Reader - Web scraping
- Hunter.io API - Email discovery and verification
- OpenAI API - Content generation

### Infrastructure
- EU-based Supabase hosting
- Secured webhook endpoints
- Token-based API authentication

---

## Architecture

### Data Flow
```
1. User uploads URLs via React frontend
2. Frontend sends batch request to Make.com webhook
   (includes: user_id, batch_id, urls, templates, webhook_secret)
3. Make.com verifies webhook secret
4. Iterator processes each URL:
   - Jina AI scrapes website content
   - OpenAI analyses business information
   - Hunter.io discovers contact email
   - OpenAI generates personalised icebreaker and message
5. Results written to Supabase with user_id association
6. Frontend receives real-time updates via Supabase subscriptions
```

### Database Schema
- **batches** - User-created batches with labels, channels, and templates
- **leads** - Processed leads with scraping results, emails, and generated content
- **successful_leads** - Leads with verified emails and complete data
- **failed_scrapes** - Failed URL processing attempts with error logging
- **profiles** - User profile data and permissions

---

## Development Challenges & Solutions

### Web Scraping Reliability
**Challenge:** Initial scraping service (ScrapeNinja) encountered rate limiting issues during batch processing.  
**Solution:** Migrated to Jina AI Reader mid-development, providing more reliable parsing and better rate limit handling.

### Multi-User Security
**Challenge:** System required proper data isolation between users whilst maintaining performance.  
**Solution:** Implemented Supabase Row Level Security policies and ensured `user_id` propagation through entire data pipeline including Make.com workflows.

### Make.com Integration
**Challenge:** Complex webhook data mapping between frontend, Make.com, and Supabase required careful configuration.  
**Solution:** Structured webhook payload with explicit user context, implemented HTTP module configuration to include `user_id` in all database operations.

### Email Quality Control
**Challenge:** Email discovery service returned generic addresses (info@, sales@) unsuitable for personalised outreach.  
**Solution:** Built filtering logic in Make.com to exclude generic addresses and prioritise personal or department-specific contacts.

### GDPR Compliance
**Challenge:** Original infrastructure hosted in US region, required EU compliance.  
**Solution:** Migrated entire Supabase project to EU region, reconfigured all webhook endpoints and API integrations.

---

## Current Status

**Production:** Live and processing leads in production environment

**Performance:**
- Batch processing: 10-50+ URLs per batch
- Average processing time: ~30 seconds per lead
- Email discovery success rate: 70-80%
- Parallel processing without rate limiting

**Users:** Multi-user system with role-based access control

---

## Technical Configuration

### Environment Variables
```env
# Supabase (EU Region)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Make.com Integration
VITE_MAKE_BATCH_WEBHOOK_URL
VITE_MAKE_WEBHOOK_SECRET
```

### Make.com Workflow Structure
```
Webhook Reception → 
Router (Secret Verification) → 
Acknowledgement Response → 
URL Iterator → 
Web Scraping → 
AI Content Generation → 
Database Insert → 
Process Completion
```

---

## Roadmap

### Version 1.0 (Complete)
- ✅ Bulk URL processing (CSV and manual input)
- ✅ Automated web scraping and data extraction
- ✅ Email discovery with verification
- ✅ AI-generated personalised content
- ✅ Multi-user authentication with RLS
- ✅ Batch management system
- ✅ Real-time processing dashboard
- ✅ GDPR-compliant EU infrastructure

### Version 1.1 (Planned)
- Direct email sending from platform
- Meta messaging integration (Facebook, Instagram, WhatsApp)
- LinkedIn automation
- Message scheduling
- Reply tracking and management

### Version 1.5 (Q3 2026)
- Voice calling integration
- Call transcription
- AI conversation summaries
- Call outcome tracking

### Version 2.0 (Q4 2026)
- Multi-channel automation
- CRM integrations (HubSpot, Salesforce)
- White-label capability
- Public API

---

## Project Information

**Developer:** Sami Mustafa  
**Organisation:** Kelpie AI  
**Status:** Production  
**License:** Proprietary

**Contact:** sami.mustafa@kelpieai.co.uk  
**Website:** https://kelpieai.co.uk

---

## License

© 2026 Kelpie AI. All rights reserved.
