# 🌾 Shanmukha Agritec Limited — Head Office Admin Portal & Field App

Frontend demo showcase for **Shanmukha Agritec Limited**, comprising:
1. **📱 Shanpoorna Field Assistant Mobile App** (Field staff client)
2. **🖥️ Head Office Admin Operations Portal** (Enterprise monitoring & vigilance portal)

---

## 🚀 Running in VS Code
1. Open folder in VS Code (`Ctrl + K, Ctrl + O` -> `c:\Users\DELL\Documents\fieldagent`).
2. Open terminal (`Ctrl + ` `).
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🎛️ Presentation Navigation: The 10 Target Sections

| # | Section | Route | Highlights |
|---|---|---|---|
| **1** | **Field Assistant (FA) Management** *(First Section)* | `/admin/fas` | Staff provisioning wizard, auto-generated employee codes (`SAGL-FA-XXXX`), territory handover, 3-24 month monitoring settings. |
| **2** | **Command Center Overview** | `/admin/command` | 8 real-time KPI cards, 14-day visit trends, district bar chart, live FA telemetry ticker (refreshes every 15s), Top/Bottom 5 leaderboard. |
| **3** | **FA Performance & Leaderboard** *(Includes Farmers Master & Beat Reassignment)* | `/admin/performance` | **Dual view toggle**: <br>• **Tab 1: FA Leaderboard & 2-3 FA Comparison Modal**<br>• **Tab 2: Farmers Master & Beat Reassignment**: Complete farmer directory, search, crop filter, overdue badges, checkbox selection, and bulk territory transfer modal. |
| **4** | **Visit Explorer & Verification** | `/admin/visits` | Multi-filter table, drawer with route map, geo-stamped photos, prescription, products sold, and verification review actions. |
| **5** | **Agronomy Intelligence & Diagnostics** | `/admin/agronomy` | Crop distribution donut chart, phenological stage bar chart, DAS histogram, top pest & disease incidence. |
| **6** | **Products & Value-Added Services Sales** | `/admin/sales` | Product revenue breakdown, pack sizes, Value-Added Services (VAS) uptake (drone spraying, soil tests), receipt gallery with zoom modal. |
| **7** | **Loyalty Points & Incentive Ledger** | `/admin/loyalty` | Points ledger per FA and farmer, earned vs redeemed metrics, and **Approve Payout** action. |
| **8** | **Data Quality, Anomaly & Vigilance Console** | `/admin/fraud` | Automated anomaly detection feed (short visits, GPS jumps, stationary FAs), review workflow (**False Positive**, **Acknowledge**, **Escalate**). |
| **9** | **Field Broadcasts & Advisory Alerts** | `/admin/broadcasts` | Push notification composer with district/group targeting, urgency priority levels (Normal, Urgent, Critical), and read-receipt analytics. |
| **10** | **Executive Reports & Audits** | `/admin/reports` | 5 ready-made English operational reports with printable official letterhead (`window.print()`) and **Export CSV**. |

---

### 🔑 Credentials & Shortcuts
- **Head Office Admin Portal**: `http://localhost:5173/admin/login` (Auto-fill with `admin@shanmukha.com` / `admin123`)
- **Field Assistant Mobile Demo**: `http://localhost:5173/` or `/mobile` (Persona: `K. Srinivas`, ID: `SAGL-FA-0142`, Medak)
- **Top Switcher**: Click the top pill `[ 🖥️ Switch to Head Office Admin Portal ]` or `[ 📱 Switch to FA Mobile App ]` to jump back and forth anytime during the client presentation.
