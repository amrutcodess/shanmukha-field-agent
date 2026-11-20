# Commercial Proposal & Quotation
**Project:** Shanmukha Agritech Field Agent Tracking System (v2 Upgrade)  
**Client:** Shanmukha Agritech  
**Date:** 16 October 2026  
**Validity:** 30 Days  

---

## 1. Executive Summary

This proposal outlines the end-to-end upgrade and deployment of the **Shanmukha Agritech Field Agent Tracking Platform**. The system provides enterprise-grade monitoring of agricultural field operations, complete with:
- **Offline-capable Android Application** for Field Agents.
- **DPDP Act (Digital Personal Data Protection) Compliant Onboarding** with OTP consent.
- **Continuous GPS-tracked visits** with anti-tampering and geofencing.
- **Admin Management Portal** for assignments, routes, compliance, and yield analysis.
- **Read-Only Client Viewer Portal** with privacy phone masking.

---

## 2. Cost Breakdown

### A. One-Time Costs

| S.No | Item / Description | Billing Entity | Amount (INR) |
|---|---|---|---|
| **1.0** | **Software Development & Deployment Fee**<br>• Database schema, triggers & RLS policies<br>• Field Agent Mobile PWA + Android (Capacitor)<br>• Admin Web Dashboard & Client Viewer<br>• Offline SQLite sync, photo watermarking, exports<br>• Staging deployment, testing & production cutover | Developer | **₹14,000** |
| **2.0** | **Google Play Console Developer Account**<br>• One-time developer registration fee for client-owned Play Store account ($25 USD) | Google (Direct) | ~₹2,100 *(one-time)* |
| **3.0** | **DLT Portal Registration** (TRAI / Telecom)<br>• Entity & SMS header registration (e.g. Jio / Airtel / Vilpower DLT) | Telecom Operator (Direct) | ~₹0 – ₹5,900 *(depending on provider)* |
| **Total One-Time Fee:** | | | **₹14,000** *(Dev)* + Vendor Direct |

> **Note:** Third-party vendor fees (Google Play, DLT, Cloud) are paid directly by Shanmukha Agritech via company credit card/billing. Developer fee covers complete engineering, implementation, and launch.

---

### B. Recurring Operational & Cloud Expenses (Estimates)

*These services are billed directly to the client based on actual usage.*

| S.No | Service | Provider | Estimated Monthly Cost | Billing Notes |
|---|---|---|---|---|
| **1** | **Backend Database & Storage**<br>Postgres DB, Auth, Edge Functions, Backups | Supabase | **Free** to **~$25/mo (~₹2,100)** | Starts on Free Tier. Upgrade to Pro ($25/mo) recommended when storage/backups grow. |
| **2** | **Web Application Hosting**<br>Vercel Pro / Free tier for Admin Portal & PWA | Vercel | **₹0 (Hobby)** to **~$20/mo (~₹1,700)** | Free tier handles standard load; Team plan optional. |
| **3** | **Transactional SMS (DPDP OTP Consent)**<br>DLT-registered OTP messages | MSG91 / Fast2SMS | **~₹0.15 to ₹0.25 per SMS**<br>(~₹150 – ₹500 / month) | Pay-as-you-go based on number of farmers onboarded. |
| **4** | **Map Tiles (GPS Maps & Polyline Routes)**<br>Leaflet base maps | OpenStreetMap / Stadia / Mapbox | **₹0** (within free tier) | OpenStreetMap is free for moderate usage. Mapbox provides 50,000 free loads/mo. |
| **Estimated Monthly Running Cost:** | | | **~₹200 to ₹2,500 / month** | *Scales with data usage & SMS volume* |

---

## 3. Scope of Features & Deliverables

### Module 1: Field Agent Mobile Application (Android / PWA)
- **Bilingual Interface**: Native support for English and Telugu (తెలుగు) with instant toggle.
- **DPDP Farmer Onboarding**:
  - Validates farmer 10-digit mobile number (+91 normalization).
  - High-accuracy GPS farm pin capture at onboarding.
  - Full-screen statutory consent notice in Telugu & English.
  - OTP-verified consent: farmer data is only committed to the database upon valid OTP confirmation.
- **Active Visit Workflow**:
  - Gated Start Visit with GPS accuracy verification (`<= 50m`).
  - Geofence verification against registered farm location (prompts reason if outside geofence).
  - Days After Sowing (DAS) auto-calculated from crop cycle sowing date and permanently snapshotted.
  - Dynamic observations and diagnosis logging (supports voice typing in Telugu).
  - Value-Added Services selection (Sticky traps, soil testing, drone spray, etc.) or explicit "None chosen".
  - Agrochemical product recommendations tied strictly to validated packaging sizes.
- **Geo-Watermarked Live Photos**:
  - Live camera capture (gallery upload blocked to prevent spoofing).
  - Burnt-in tamper-proof watermark stamp: IST timestamp, GPS coordinates (5 decimal places), accuracy, Farmer Code, Agent Name, Visit ID.
  - Automatic compression (~1MB) and cryptographic SHA-256 verification hash.
- **Offline Mode & SQLite Sync**:
  - Start, conduct, and record visits without internet connectivity in remote villages.
  - Automatic background synchronization when network is restored. 

---

### Module 2: Admin Management Web Portal
- **Interactive KPI Dashboard**:
  - Weekly agent compliance metrics (% of assigned farmers visited on schedule).
  - Overdue visit indicators and visit volume tracking.
  - Real-time quality flags (geofence breaches, short durations, mock locations, clock skew).
- **Farmers & Assignment Directory**:
  - Comprehensive farmer directory with multi-criteria filters (region, crop, agent, consent).
  - Single and bulk farmer reassignment tools.
- **Strava-Style Visit & Route Maps**:
  - Visual inspection of agent travel path (GPS polyline tracks) during active visits.
  - Detection and visual highlighting of GPS signal drops and tracking gaps.
  - "Agent Day View": Chronological map of all visits made by an agent in a single day.
- **Location Hierarchy Management**:
  - Region -> District -> Village management with intelligent, collision-safe rename and merge tools.
- **Bilingual Catalog Management**:
  - Manage crops, crop-specific growth stages, products, pack sizes, and services.
- **Yield & Advisory Outcome Reporting**:
  - Baseline farmer-reported yield vs. post-harvest actual yield comparison.
  - Yield delta per acre and product correlation analytics.
- **Audit Logging & English Export**:
  - Audit logging of sensitive actions (reassignments, consent changes, configuration updates).
  - Multi-sheet Excel exports (Farmers, Visits, Purchases, Yield) enforced strictly in English with IST timestamps.

---

### Module 3: Client Viewer Portal (Read-Only)
- **Executive Read-Only Access**:
  - Dedicated portal for company leadership or external stakeholders.
  - View visit timelines, harvest progress, and geographical coverage.
- **Data Privacy & Phone Masking**:
  - Farmer contact numbers are masked by default (`XXXXXX1234`) directly at the database layer.
  - Export capabilities restricted unless explicitly authorized by the administrator.

---

### Module 4: Architecture, Security & Compliance
- **Database Integrity Enforcement**:
  - Server-authoritative timestamps (agents cannot alter start, end, or duration times).
  - Exclusion constraints preventing overlapping visits by the same agent.
  - Partial unique index restricting agents to at most one active visit at any time.
- **Append-Only Consent Ledger**:
  - Immutable audit ledger: database triggers strictly block `UPDATE`, `DELETE`, and `TRUNCATE` operations on consent logs.
- **Zero-Trust Row Level Security (RLS)**:
  - Strict data isolation ensuring agents can only access farmers and visits assigned to them.
  - Deactivated agents are blocked instantly across all API and storage endpoints.

---

## 4. Payment Milestones & Schedule

| Milestone | Deliverables | Percentage | Amount (INR) |
|---|---|---|---|
| **Milestone 1: Project Initiation & Staging** | Setup staging environment, database migrations 001–011, security constraints & RLS verification | 30% | ₹4,200 |
| **Milestone 2: Core Workflows & Admin Portal** | Admin dashboard, farmer assignments, catalog management, consent OTP integration | 40% | ₹5,600 |
| **Milestone 3: Mobile PWA, Android Build & Cutover** | Offline sync, photo watermarking, Android APK/AAB build, production cutover & handoff | 30% | ₹4,200 |
| **Total** | | **100%** | **₹14,000** |

---

## 5. Exclusions & Client Prerequisites

1. **DLT Entity & SMS Credentials**: Shanmukha Agritech will provide active DLT-approved SMS account credentials (MSG91/equivalent).
2. **Google Play Console Account**: Client will provide developer access or register their Play Console account for publishing.
3. **Legal Content**: Official legal wording for DPDP consent notice, privacy policy, and grievance contacts to be vetted by client's counsel.
4. **Catalog Master Data**: Client to provide official lists of crops, growth stages, products, and packaging sizes.
