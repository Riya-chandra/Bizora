#  Bizora - Automated Business Dashboard

A **complete business management system** for WhatsApp-based selling. Bizora helps businesses track customers, manage orders, generate invoices, and automate pricing—all powered by intelligent AI parsing.

---

##  Quick Overview

```
Customer sends WhatsApp message → AI parses order → Order created → Invoice generated
     "mujhe 2 saree chahiye"        ↓              ↓               ↓
                              [Smart Parser]  [Database]      [Professional PDF]
```

---

##  Key Features

###  Order Management
- ✅ **Intelligent Message Parsing**: Understands Hinglish & Indian English ("mujhe 2 kurti chahiye aur 1 duppatta")
- ✅ **Auto Order Creation**: Orders auto-created from WhatsApp messages
- ✅ **Order Tracking**: Track status (Pending, Paid, Draft)
- ✅ **Cascade Delete**: Delete message → auto-deletes related orders & invoices

###  Invoice & Billing
- ✅ **Professional HTML Invoices**: Print-to-PDF compatible invoices
- ✅ **Auto GST Calculation**: 18% GST automatically calculated
- ✅ **Invoice Status**: Issued, Pending, Paid tracking
- ✅ **Itemized Breakdown**: Clear quantity × unit price = amount

###  Customer Management
- ✅ **Customer Profiles**: Store phone, name, order history
- ✅ **Phone Number Matching**: Auto-link messages to customers
- ✅ **Customer Stats**: Total spent, order count, payment status

###  Product & Pricing
- ✅ **Dynamic Pricing**: Update prices via admin messages
- ✅ **Product Database**: Store kurti, dupatta, saree prices
- ✅ **Fuzzy Price Matching**: Even if customer says "blue kurti", system matches to stored "kurti"

###  Dashboard
- ✅ **Real-time Stats**: Total revenue, pending orders, recent messages
- ✅ **Revenue Tracking**: See how much you've earned today/this week
- ✅ **Live Message Feed**: See orders coming in real-time via SSE

---

##  How It Works - Complete Flow

### **1. Message Ingestion** 
```
WhatsApp → Twilio Webhook → /api/ingest-chat → Parser
```
- Customer texts: `"Hi, I want 2 red kurtis and 1 dupatta, price?"`
- Twilio forwards to your backend
- Message stored in database

### **2. Message Parsing** (Three-Layer Strategy)
```
Message: "mujhe 2 kurti chahiye aur 1 duppatta"
         ↓
   [Layer 1: Regex] → Extract numbers & words → Confidence: 0.92 if price found
         ↓
   [Layer 2: Fuzzy] → Match "kurti" with product DB using fuse.js
         ↓
   [Layer 3: FREE AI] → Pattern-based parsing (no API costs!)
         • Split by "aur"/"and"
         • Match qty + product name
         • Confidence: 0.85
```

**Result:**
```json
{
  "items": [
    { "name": "kurtis", "quantity": 2, "price": 40000 },
    { "name": "duppatta", "quantity": 1, "price": 15000 }
  ],
  "confidence": 0.85,
  "interpretation": "2 kurtis (₹40,000 each) + 1 duppatta (₹15,000)"
}
```

### **3. Order Creation** 
```
Parsed Items → Order Record Created → Invoice Generated → Database Saved
```
- Total: ₹95,000 + 18% GST = ₹112,100
- Status: Pending

### **4. Invoice Generation**
```
Order Data → generateInvoiceHTML() → Professional HTML
```
- Company branding (BIZORA)
- Itemized table
- Tax calculation
- Payment info
- Print-to-PDF via browser

### **5. Customer View**
```
Dashboard Shows:
  ├─ Invoices Table (click Download → PDF)
  ├─ Orders Table (track status)
  ├─ Messages View (see original texts)
  ├─ Customers (track repeat buyers)
  └─ Analytics (revenue, pending)
```

---

##  Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BIZORA SYSTEM FLOW                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ WhatsApp     │  Customer texts: "2 kurti, 1 duppatta"
│ Customer     │
└──────┬───────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ TWILIO WEBHOOK (/api/ingest-chat)                          │
│ • Receives message                                          │
│ • Stores in messages table                                  │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ AI PARSER SYSTEM (server/ai-parser.ts)                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Regex Layer → Confidence 0.92 (if price detected)      │  │
│ │ Fuzzy Layer → Match products via fuse.js              │  │
│ │ FREE AI Layer → Pattern-based extraction (0.85)       │  │
│ └────────────────────────────────────────────────────────┘  │
│ Returns: { items, confidence, interpretation }             │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE LAYER (PostgreSQL + Drizzle ORM)                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Messages   → {id, body, customerId, parsedData}       │  │
│ │ Orders     → {id, customerId, totalAmount, items}    │  │
│ │ Invoices   → {id, orderId, invoiceNumber, GST}       │  │
│ │ Customers  → {id, phone, name, createdAt}           │  │
│ │ ProductPrices → {name, unitPrice, businessAccount}  │  │
│ └────────────────────────────────────────────────────────┘  │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ INVOICE GENERATION (server/invoice-pdf.ts)                  │
│ generateInvoiceHTML() → Beautiful HTML with CSS              │
│ • Company branding                                          │
│ • Itemized table                                            │
│ • Tax calculation (18% GST)                                 │
│ • Print-to-PDF support                                      │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND DASHBOARD (React + TypeScript)                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Pages:                                                  │  │
│ │ • Overview: Stats & analytics                          │  │
│ │ • Invoices: View & download as PDF                     │  │
│ │ • Orders: Track status                                 │  │
│ │ • Messages: See original texts                         │  │
│ │ • Customers: Manage contact list                       │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

##  Tech Stack

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build
- **Tailwind CSS** - Styling
- **Shadcn UI** - Beautiful components
- **Tanstack React Query** - Data fetching & caching
- **Wouter** - Lightweight routing

### **Backend**
- **Express.js** - REST API framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **Twilio** - WhatsApp integration
- **Fuse.js** - Fuzzy matching for products
- **OpenAI** - Optional advanced parsing

### **DevOps & Build**
- **Vite** - Frontend bundling
- **esbuild** - Server bundling
- **Drizzle Kit** - Database migrations
- **tsx** - TypeScript execution

---

##  Project Structure

```
bizora/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx    # Main layout wrapper
│   │   │   ├── AmountDisplay.tsx      # Format currency
│   │   │   ├── StatusBadge.tsx        # Order status visual
│   │   │   └── ui/                    # Shadcn components
│   │   ├── pages/
│   │   │   ├── Overview.tsx           # Dashboard stats
│   │   │   ├── Invoices.tsx           # Invoice list & PDF download
│   │   │   ├── Orders.tsx             # Order management
│   │   │   ├── Messages.tsx           # Message thread view
│   │   │   ├── Customers.tsx          # Customer list
│   │   │   └── not-found.tsx          # 404 page
│   │   ├── hooks/
│   │   │   ├── use-invoices.ts        # Fetch invoices
│   │   │   ├── use-orders.ts          # Fetch orders
│   │   │   ├── use-messages.ts        # Fetch messages
│   │   │   ├── use-customers.ts       # Fetch customers
│   │   │   ├── use-dashboard.ts       # Fetch stats
│   │   │   └── use-toast.ts           # Toast notifications
│   │   ├── App.tsx                    # Route setup
│   │   └── main.tsx                   # Entry point
│   └── index.html
│
├── server/
│   ├── index.ts                       # Express app setup
│   ├── routes.ts                      # API endpoints
│   ├── db.ts                          # Database connection
│   ├── storage.ts                     # Database abstraction layer
│   ├── ai-parser.ts                   # Message parsing logic
│   ├── invoice-pdf.ts                 # HTML invoice generation
│   └── vite.ts                        # Vite dev middleware
│
├── shared/
│   ├── routes.ts                      # API route definitions (Zod schemas)
│   └── schema.ts                      # Database schema (Drizzle)
│
├── script/
│   └── build.ts                       # Build script (esbuild + vite)
│
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
├── tailwind.config.ts                 # Tailwind config
├── vite.config.ts                     # Vite config
├── drizzle.config.ts                  # Drizzle config
├── vercel.json                        # Vercel deployment config
└── README.md                          # This file
```

---

##  Getting Started

### **Prerequisites**
- Node.js 18+
- PostgreSQL database (or use Vercel Postgres)
- Twilio account (for WhatsApp integration)
- (Optional) OpenAI API key

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/bizora.git
cd bizora
npm install
```

### **2. Environment Setup**
Create `.env` file:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bizora

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AI Parser (Optional)
AI_PARSER_MODE=free  # or "openai"
OPENAI_API_KEY=sk-...  # Only if AI_PARSER_MODE=openai

# Server
NODE_ENV=development
```

### **3. Database Setup**
```bash
# Create database tables
npm run db:push
```

### **4. Run Locally**
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

##  API Endpoints

### **Messages**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ingest-chat` | Receive WhatsApp message from Twilio |
| GET | `/api/messages` | List all messages |
| DELETE | `/api/messages/:id` | Delete message (cascade deletes orders/invoices) |

### **Orders**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/orders` | List all orders |
| PATCH | `/api/orders/:id/status` | Update order status |

### **Invoices**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoices/:id/pdf` | Download invoice as HTML/PDF |

### **Customers**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/customers` | List all customers |

### **Stats**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/stats` | Get dashboard stats |

---


##  Usage Examples

### **1. Customer Places Order via WhatsApp**
```
Customer: "mujhe 2 kurti chahiye aur 1 duppatta"
         ↓
System: Parses → 2 kurtis @ ₹40,000 + 1 duppatta @ ₹15,000 = ₹95,000 + 18% GST
         ↓
Order created → Invoice #45 generated → Dashboard updated
```

### **2. Admin Updates Product Price**
```
Admin: "update kurtis price to 500"
         ↓
System: Updates product_prices table
         ↓
Next order uses new ₹50,000 price
```

### **3. Download Invoice as PDF**
```
Click "Download" on invoice #45
         ↓
Opens: http://localhost:3000/api/invoices/45/pdf
         ↓
Professional HTML invoice appears
         ↓
Ctrl+P → Save as PDF (or Print to PDF)
```

### **4. Delete Message & Cleanup**
```
Delete message #123
         ↓
Cascade delete triggered:
  • Related orders deleted
  • Related invoices deleted
  • No orphaned records left
```

### **Step 2: Set Environment Variables**
```
DATABASE_URL = (from Vercel Postgres)
NODE_ENV = production
AI_PARSER_MODE = free
```

### **Step 3: Deploy**
```bash
# Via CLI
vercel --prod

# Or use GitHub
```

Live URL: `https://your-app.vercel.app`

---

##  Security Notes

- ✅ All prices stored in **paisa** (not rupees) to avoid decimal issues
- ✅ Database queries use **Drizzle ORM** (SQL injection safe)
- ✅ Message parsing uses **Zod validation** (type-safe)
- ✅ Twilio webhook validates **signature** (request integrity)
-  For production: Add authentication (Passport.js ready)

---

##  Performance Tips

- **Caching**: Tanstack Query caches messages, orders, invoices
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Parser**: FREE AI mode is instant (no API latency)
- **Bundle**: esbuild bundles server for 50% smaller cloud deployment

---

##  Troubleshooting

### **"Message not parsing correctly"**
→ Check AI_PARSER_MODE in .env (should be "free" for local dev)

### **"404 Page Not Found for /api/invoices/X/pdf"**
→ Invoice might not exist. Check ID matches database.

### **"Cascade delete not working"**
→ Make sure `deleteMessageWithRelated()` is called (not `deleteMessage()`)

### **"Database connection error"**
→ Verify DATABASE_URL in .env, server must be running

---

##  Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

##  License

MIT License - See LICENSE file for details

---

##  Support

Questions? Issues?
-  Email: riyachandra9119@gmail.com

---

##  Changelog

### v1.0.0 (Current)
- ✅ WhatsApp message parsing with AI
- ✅ Order auto-creation
- ✅ Professional HTML invoice generation
- ✅ Cascade delete for data integrity
- ✅ Real-time dashboard with stats
- ✅ Customer & product management
- ✅ Vercel deployment ready

---

**Made with ❤️ for Indian businesses 🇮🇳**


