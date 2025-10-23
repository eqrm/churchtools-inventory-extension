# Visual UI Access Guide

Quick reference showing exactly where to find every feature in the application.

---

## 📱 Sidebar Navigation (11 Links)

```
┌─────────────────────────────────┐
│  Inventory Manager              │
├─────────────────────────────────┤
│  🏠  Dashboard                  │  → Stats, Quick Start
│  📁  Categories                 │  → Asset Categories CRUD
│  📦  Assets                     │  → Asset Management (4 view modes!)
│  📅  Bookings                   │  → Booking Management
│  📦  Kits                       │  → Kit Management
│  📋  Stock Take                 │  → Inventory Audits
│  📊  Reports              [NEW] │  → All Reports Hub ✨
│  🔧  Maintenance         [NEW] │  → Maintenance Dashboard ✨
│  🔍  Quick Scan      (Alt+S)   │  → Global Scanner
│  ⚙️  Settings                   │  → App Configuration
│  ⌨️  Keyboard Shortcuts         │  → Shortcut Reference
└─────────────────────────────────┘
```

---

## 📊 Reports Page (NEW!)

**Access**: Sidebar → Reports

```
┌─────────────────────────────────────────────┐
│  Reports                                    │
│  Generate and view reports                  │
├─────────────────────────────────────────────┤
│                                             │
│  📖  Booking History Report                 │
│      View booking patterns and history      │
│      [View Report] ──────────────────────→ │
│                                             │
│  🔧  Maintenance Compliance Report          │
│      Track maintenance schedules            │
│      [View Report] ──────────────────────→ │
│                                             │
│  📈  Asset Utilization Report               │
│      Analyze asset usage patterns           │
│      [View Report] ──────────────────────→ │
│                                             │
│  📋  Stock Take Summary Report              │
│      Review inventory audit results         │
│      [View Report] ──────────────────────→ │
│                                             │
└─────────────────────────────────────────────┘
```

**What You Can Do**:
- Click any report to view/generate
- Filter by date range, category, location
- Export report data
- Print reports

---

## 🔧 Maintenance Page (NEW!)

**Access**: Sidebar → Maintenance

```
┌─────────────────────────────────────────────────┐
│  Maintenance                                    │
│  Track and manage asset maintenance             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚠️  OVERDUE MAINTENANCE (3)                    │
│  ┌───────────────────────────────────────────┐ │
│  │  🎥 Camera #001 - Safety Check            │ │
│  │  Due: 5 days ago                          │ │
│  │  [Schedule Now] [Mark Complete]           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📅  UPCOMING MAINTENANCE (7)                   │
│  ┌───────────────────────────────────────────┐ │
│  │  🎤 Microphone #042 - Battery Replace     │ │
│  │  Due: In 3 days                           │ │
│  │  [View Schedule] [Complete Early]         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [+ Add Maintenance Schedule]                   │
│  [+ Record Maintenance]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**What You Can Do**:
- View overdue maintenance (with alerts)
- See upcoming maintenance schedules
- Add new maintenance schedules
- Record completed maintenance
- View maintenance history per asset

---

## 📦 Assets Page (UPGRADED!)

**Access**: Sidebar → Assets

### View Mode Selector (NEW!)

```
┌───────────────────────────────────────────────────────────┐
│  Assets                                                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  [📋 List] [🖼️ Gallery] [📊 Kanban] [📅 Calendar]  ← NEW! │
│     ▲                                                     │
│     └─ Click to switch view modes                        │
│                                                           │
│  [🔍 Filter] [💾 Saved Views] [+ Create Asset]           │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 1. List View (Default)

```
┌─────────────────────────────────────────────────────────┐
│  Number    │  Name         │  Category    │  Status     │
├─────────────────────────────────────────────────────────┤
│  CAM-001   │  Camera A     │  Cameras     │  ✅ Available│
│  CAM-002   │  Camera B     │  Cameras     │  🔄 In Use   │
│  MIC-001   │  Microphone   │  Audio       │  ✅ Available│
└─────────────────────────────────────────────────────────┘
```

### 2. Gallery View (NEW!)

```
┌──────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ [IMG]   │  │ [IMG]   │  │ [IMG]   │            │
│  │ CAM-001 │  │ CAM-002 │  │ MIC-001 │            │
│  │ Camera A│  │ Camera B│  │ Mic     │            │
│  │ ✅ Avail │  │ 🔄 Used │  │ ✅ Avail │            │
│  └─────────┘  └─────────┘  └─────────┘            │
└──────────────────────────────────────────────────────┘
```

### 3. Kanban View (NEW!)

```
┌────────────┬────────────┬────────────┬────────────┐
│ Available  │  In Use    │  In Repair │  Broken    │
├────────────┼────────────┼────────────┼────────────┤
│ CAM-001    │ CAM-002    │ MIC-005    │ SPK-012    │
│ MIC-001    │ CAM-003    │            │            │
│ SPK-001    │            │            │            │
│ [+ Add]    │            │            │            │
└────────────┴────────────┴────────────┴────────────┘
     ↑
     └─ Drag & drop to change status
```

### 4. Calendar View (NEW!)

```
┌────────────────────────────────────────────────────┐
│  October 2025                                      │
├────────────────────────────────────────────────────┤
│  Mon  │  Tue  │  Wed  │  Thu  │  Fri  │  Sat │ Sun│
├───────┼───────┼───────┼───────┼───────┼─────┼────┤
│   14  │   15  │   16  │   17  │   18  │  19 │ 20 │
│       │       │       │ CAM-  │ CAM-  │     │    │
│       │       │       │ 001   │ 001   │     │    │
│       │       │       │ CAM-  │ CAM-  │     │    │
│       │       │       │ 002   │ 002   │     │    │
└───────┴───────┴───────┴───────┴───────┴─────┴────┘
                           ↑
                    Shows which assets are
                    booked on each day
```

### Advanced Filter Builder (NEW!)

**Access**: Assets Page → Filter button

```
┌──────────────────────────────────────────────────┐
│  Advanced Filters                                │
├──────────────────────────────────────────────────┤
│                                                  │
│  Filter #1:                                      │
│  [Category] [equals] [Cameras]           [❌]   │
│                                                  │
│  Filter #2:                                      │
│  [Status] [equals] [Available]           [❌]   │
│                                                  │
│  Filter #3:                                      │
│  [Custom Field: "Resolution"] [>=] [4K]  [❌]   │
│                                                  │
│  [+ Add Filter]                                  │
│                                                  │
│  [Apply] [Clear] [Save View...]                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Saved Views (NEW!)

**Access**: Assets Page → Saved Views button

```
┌──────────────────────────────────────────────────┐
│  My Saved Views                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  📷  Available Cameras                           │
│      List view • 2 filters                       │
│      [Load] [Edit] [Delete]                      │
│                                                  │
│  🎤  Audio Equipment                             │
│      Gallery view • 1 filter                     │
│      [Load] [Edit] [Delete]                      │
│                                                  │
│  ⚠️  Needs Maintenance                           │
│      Kanban view • 3 filters                     │
│      [Load] [Edit] [Delete]                      │
│                                                  │
│  [+ Create New View]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## ⚙️ Settings Page (5 Tabs)

**Access**: Sidebar → Settings

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [#️⃣ Asset Numbering] [#️⃣ Asset Prefixes] [📍 Locations] │
│  [📱 Scanners] [⚙️ General]                             │
│   └─ Active tab                                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Asset Numbering Configuration                    │ │
│  │                                                   │ │
│  │  Default Prefix: [CAM-]                          │ │
│  │  Next Number:    [043]                           │ │
│  │  Format:         CAM-043                         │ │
│  │                                                   │ │
│  │  [Save Settings]                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: Asset Numbering
- Configure default asset numbering
- Set global prefix and sequence

### Tab 2: Asset Prefixes (E5 - NEW!)
- Manage multiple asset prefixes
- CAM-, MIC-, SPK-, etc.
- Color coding and descriptions

### Tab 3: Locations
- Manage storage locations
- Building/Room hierarchy

### Tab 4: Scanners
- Configure barcode scanners
- Add scanner models
- Set scanner preferences

### Tab 5: General
- App-wide settings
- Date formats, language, etc.

---

## 🔍 Quick Scan (Global)

**Access**: 
- Keyboard: `Alt+S` (Windows/Linux) or `Cmd+S` (Mac)
- Sidebar → Quick Scan

```
┌──────────────────────────────────────────┐
│  Quick Scan                              │
├──────────────────────────────────────────┤
│                                          │
│  Scan or enter asset number:             │
│  ┌────────────────────────────────────┐ │
│  │  [Scanning...]                     │ │
│  │  ▮                                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Or type:                                │
│  [CAM-001_____________]                  │
│                                          │
│  [Cancel]                                │
│                                          │
└──────────────────────────────────────────┘
     ↓ Scan/Enter
┌──────────────────────────────────────────┐
│  Asset Found: CAM-001                    │
│  Camera A - Sony A7III                   │
│  Status: ✅ Available                    │
│                                          │
│  [View Details] [Book Asset] [Edit]      │
└──────────────────────────────────────────┘
```

---

## 📋 Stock Take Page

**Access**: Sidebar → Stock Take

```
┌──────────────────────────────────────────────────────┐
│  Stock Take                                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Active Sessions (1)                                 │
│  ┌────────────────────────────────────────────────┐ │
│  │  Q4 2025 Camera Audit                         │ │
│  │  Started: Oct 15, 2025                        │ │
│  │  Progress: 12/45 scanned (27%)                │ │
│  │  [Continue] [Pause] [Complete]                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Completed Sessions (3)                              │
│  ┌────────────────────────────────────────────────┐ │
│  │  Q3 2025 Full Inventory                       │ │
│  │  Completed: Sep 30, 2025                      │ │
│  │  Found: 142/145 (98%)                         │ │
│  │  [View Report] [Download]                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [+ Start New Stock Take]                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**During Session**:
```
┌──────────────────────────────────────────────────────┐
│  Stock Take: Q4 2025 Camera Audit                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Progress: 12/45 scanned (27%)                       │
│  [▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░]                      │
│                                                      │
│  Scan Asset:                                         │
│  [Scanning...]                                       │
│                                                      │
│  Recently Scanned:                                   │
│  ✅ CAM-001 - Just now                              │
│  ✅ CAM-002 - 30 seconds ago                        │
│  ✅ CAM-003 - 1 minute ago                          │
│                                                      │
│  [Pause] [Complete Session]                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📅 Bookings & Calendar

**Access**: Sidebar → Bookings

```
┌──────────────────────────────────────────────────────┐
│  Bookings                                            │
├──────────────────────────────────────────────────────┤
│  [📋 List View] [📅 Calendar View]                   │
│                                                      │
│  Upcoming Bookings (5)                               │
│  ┌────────────────────────────────────────────────┐ │
│  │  CAM-001 - Youth Service Filming               │ │
│  │  Oct 22-23, 2025 • John Smith                  │ │
│  │  Status: ⏳ Pending Approval                   │ │
│  │  [Approve] [Reject] [View]                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [+ New Booking]                                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Calendar View**:
```
┌──────────────────────────────────────────────────────┐
│  Booking Calendar - October 2025                     │
├──────────────────────────────────────────────────────┤
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun           │
│   14    15    16    17    18    19    20           │
│         📷   📷   📷                                  │
│         CAM  CAM  CAM                                │
│         001  001  001                                │
│              🎤                                       │
│              MIC                                      │
│              005                                      │
│                                                      │
│  Color Key:                                          │
│  🟢 Available  🟡 Pending  🔵 Approved  🔴 In Use    │
└──────────────────────────────────────────────────────┘
```

---

## 📦 Kits Management

**Access**: Sidebar → Kits

```
┌──────────────────────────────────────────────────────┐
│  Kits                                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Fixed Kits (2)                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  📦 Sunday Service Kit                         │ │
│  │  3 cameras, 2 mics, 1 mixer                    │ │
│  │  Status: ✅ All Available                      │ │
│  │  [View] [Book] [Edit]                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Flexible Kits (1)                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │  🎤 Audio Package                              │ │
│  │  Any 2 mics + 1 mixer from Audio category      │ │
│  │  Status: ✅ Available                          │ │
│  │  [View] [Book] [Edit]                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [+ Create Kit]                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

**Access**: Sidebar → Keyboard Shortcuts

```
┌──────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Global                                              │
│  Alt+S / Cmd+S ............ Quick Scan               │
│  ? ........................ Show this help           │
│                                                      │
│  Navigation                                          │
│  Alt+D / Cmd+D ............ Go to Dashboard          │
│  Alt+A / Cmd+A ............ Go to Assets             │
│  Alt+B / Cmd+B ............ Go to Bookings           │
│  Alt+R / Cmd+R ............ Go to Reports            │
│  Alt+M / Cmd+M ............ Go to Maintenance        │
│                                                      │
│  Assets Page                                         │
│  N ........................ New Asset                │
│  / ........................ Focus Search              │
│  1/2/3/4 .................. Switch View Mode         │
│                                                      │
│  [Close]                                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Common User Workflows

### Create and Book an Asset

```
1. Sidebar → Categories
2. Create "Cameras" category
3. Sidebar → Settings → Asset Prefixes
4. Add "CAM-" prefix
5. Sidebar → Assets
6. Click [+ Create Asset]
7. Select "CAM-" prefix → Auto-number CAM-001
8. Fill in details → Save
9. Click asset CAM-001
10. Click [Book Asset]
11. Select dates → Submit
```

### Run a Report

```
1. Sidebar → Reports
2. Click "Asset Utilization Report"
3. Select date range
4. Select category (optional)
5. Click [Generate Report]
6. View charts and tables
7. Click [Export] or [Print]
```

### Schedule Maintenance

```
1. Sidebar → Maintenance
2. Click [+ Add Maintenance Schedule]
3. Select asset
4. Choose interval (weekly/monthly/yearly)
5. Set next due date
6. Add notes → Save
7. See in "Upcoming Maintenance"
```

### Perform Stock Take

```
1. Sidebar → Stock Take
2. Click [+ Start New Stock Take]
3. Name session → Start
4. Use Quick Scan (Alt+S) or mobile scanner
5. Scan each asset
6. Watch progress bar
7. Click [Complete Session]
8. View discrepancy report
```

---

## 📍 Quick Reference

| Feature | Navigation Path | Keyboard |
|---------|----------------|----------|
| Dashboard | Sidebar → Dashboard | Alt+D |
| Categories | Sidebar → Categories | - |
| Assets (List) | Sidebar → Assets | Alt+A |
| Assets (Gallery) | Assets → Gallery button | 2 |
| Assets (Kanban) | Assets → Kanban button | 3 |
| Assets (Calendar) | Assets → Calendar button | 4 |
| Filter Assets | Assets → Filter button | F |
| Bookings | Sidebar → Bookings | Alt+B |
| Booking Calendar | Bookings → Calendar tab | - |
| Kits | Sidebar → Kits | - |
| Stock Take | Sidebar → Stock Take | - |
| **Reports** | **Sidebar → Reports** | **Alt+R** |
| **Maintenance** | **Sidebar → Maintenance** | **Alt+M** |
| Quick Scan | Sidebar → Quick Scan | **Alt+S** |
| Settings | Sidebar → Settings | - |
| Help | Sidebar → Keyboard Shortcuts | ? |

---

**All 172+ components are now accessible!** 🎉

Use this guide to find any feature quickly.
