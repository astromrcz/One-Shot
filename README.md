# One Shot Bar & Billiards Management System 🎱

A complete web-based management system for billiard bars with integrated tattoo studio support, built with React, TypeScript, and Supabase.

---

##  LATEST UPDATE: Database Schema Rebuilt!

**The database has been completely redesigned** 


##  Features

### For Customers
-  **Table Reservations** - Book billiard tables online with deposits
-  **Tattoo Bookings** - Schedule appointments with artists
-  **Feedback System** - Submit reviews and ratings
-  **Live Monitoring** - View available tables in real-time

### For Staff
-  **Real-time Timers** - Track table sessions automatically
-  **Queue Management** - Handle walk-in customers efficiently
-  **Payment Processing** - GCash and cash payment support
-  **Activity Dashboard** - Monitor all operations

### For Admins
- 👨‍💼 **User Management** - Manage staff and artist accounts
-  *Configuration** - Set rates, terms, and business hours
-  **Announcements** - Post updates and promotions
-  **Analytics** - Track revenue and customer feedback

### For Tattoo Artists
-  **Appointment Management** - View and manage bookings
-  **Calendar** - Set availability and unavailable dates
-  **Rescheduling** - Propose new dates for clients
-  **Design Gallery** - View customer inspiration images

---

## 🏗️ Tech Stack

- **Frontend**: React 18.3, TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7 (Data Mode)
- **Database**: Supabase (PostgreSQL)
- **State**: React Context API
- **UI Components**: Radix UI, Material-UI
- **Forms**: React Hook Form
- **Charts**: Recharts
---
## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd one-shot-billiards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (REQUIRED!)
   - Go to https://supabase.com/dashboard
   - Select your project: `thbvvmgmkhokfhareclr.supabase.co`
   - Run the SQL migration (see `RUN_MIGRATION_NOW.md`)

4. **Start development server**
   ```bash
   npm run dev
   ```
5. **Open your browser**
   - Navigate to `http://localhost:5173`

## 🔑 Default Credentials

### Staff/Admin Login
- URL: `/staff/login` or `/admin`
- Username: `admin`
- Password: `admin123`

---

## 🛣️ Routes

### Customer Routes
- `/` - Homepage with announcements
- `/reserve` - Make table reservations
- `/tattoo` - Book tattoo appointments
- `/feedback` - Submit feedback
- `/monitor` - Live table monitor (TV display)

### Staff Routes
- `/staff/login` - Staff authentication
- `/staff/dashboard` - Staff overview
- `/staff/tables` - Table management
- `/staff/queue` - Queue management
- `/staff/reservations` - Reservation management

### Admin Routes
- `/admin` - Admin authentication
- `/admin/dashboard` - Admin overview
- `/admin/tables` - Table configuration
- `/admin/staff` - Staff user management
- `/admin/artists` - Tattoo artist management
- `/admin/rates` - Pricing configuration
- `/admin/promo-codes` - Discount code management
- `/admin/announcements` - Announcement management
- `/admin/reports` - Revenue and analytics

### Artist Routes
- `/artist/login` - Artist authentication
- `/artist/dashboard` - Artist overview
- `/artist/bookings` - Appointment management
- `/artist/calendar` - Availability settings


### Test Accounts 
- `admin` / `admin123` - Admin
- `staff1` / `staff123` - Manager
- `cashier1` / `cash123` - Cashier
- `kiko` / `kiko123` - Tattoo Artist

---

## 📊 Key Features

### ₱150/Hour Base Rate
- Configurable hourly rate
- Happy Hour discounts (6-7 PM default)
- Overtime rates
- Promo code support

### Payment Methods
- GCash
- Cash
- Down payment (25% default)
- Balance on arrival

### Real-time Features
- Live table status
- Session timers
- Queue updates
- Availability calendar

### Reservation System
- Advance booking
- Deposit confirmation
- Email/SMS notifications (ready for integration)
- Cancellation policy

### Tattoo Studio
- Artist portfolios
- Design consultations
- ₱500 deposit
- Rescheduling support
- Inspiration image uploads

Built with:
- React + TypeScript
- Supabase
- Tailwind CSS
- Radix UI
- Material-UI

© 2026 One Shot Bar & Billiards. All rights reserved.