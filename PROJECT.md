# Rana Forwarder — Project Overview

A logistics/courier company website with a public marketing site, lead-capture
forms, live shipment tracking, and an admin back office for managing content,
quotations, shipments, and payments.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | MongoDB via Mongoose |
| Auth | JWT in an httpOnly cookie (`admin_token`), signed with `JWT_SECRET` |
| Forms/validation | React Hook Form + Zod |
| Animation | Framer Motion |
| Email | Nodemailer via a Gmail App Password |
| Payments | Cashfree Payment Links API |
| Shipment tracking | Ship24 (aggregator), plus direct UPS / FedEx / DHL APIs |
| PDF generation | PDFKit (quotation PDFs) |

## Folder Structure

```
src/app/(site)/        Public marketing pages (home, services, about, blog, quote, track-shipment, ...)
src/app/admin/          Admin panel (login is public, everything under (protected) requires a session)
src/app/api/            REST-style route handlers
  ├─ admin/             CRUD endpoints for every admin resource (auth-gated)
  ├─ contact/           Public contact form submission
  ├─ quote/             Public quote request submission
  ├─ tracking/[number]/ Public shipment tracking lookup
  └─ webhooks/cashfree/ Payment webhook receiver
src/components/         UI components, grouped by feature (home, quote, tracking, admin, ui, ...)
src/lib/                Shared server logic: db connection, auth, mail, rate limiting,
                         Cashfree client, carrier API adapters, PDF/email generation
src/models/             Mongoose schemas (one per collection)
scripts/seed.ts         Seeds the database (`npm run seed`)
```

## Data Model (MongoDB collections)

`User` (admins), `Quote`, `Quotation`, `Contact`, `Customer`, `Shipment`,
`Carrier`, `Payment`, `Service`, `Blog`, `Testimonial`, `Team`, `Faq`,
`Homepage`, `Seo`, `Settings`.

## Core Flows

**1. Public lead capture**
Visitor submits the Quote or Contact form → validated with Zod → saved to
MongoDB (`Quote` / `Contact`) → notification email sent to `NOTIFY_EMAIL`
(defaults to `GMAIL_USER`) via Nodemailer.

**2. Admin authentication**
`/admin/login` posts credentials to `/api/admin/auth/login`, which checks the
`User` collection (bcrypt password hash) and, on success, signs a JWT with
`signSession()` and sets it as an httpOnly `admin_token` cookie (7-day expiry).
Every route under `admin/(protected)` and `api/admin/*` calls
`getAdminSession()` to verify that cookie.

- A dev-only bypass exists: if `NODE_ENV !== "production"` **and**
  `DEV_SKIP_AUTH=true`, `getAdminSession()` returns a fake session so you can
  work locally without a reachable database. This is inert on Vercel because
  `NODE_ENV` is always `"production"` there.

**3. Quotation → Payment**
Admin converts a `Quote` into a `Quotation` (with pricing) from the admin
panel, and can email it to the customer as a PDF (`quotationPdf.ts` +
`quotationEmail.ts`). A `Payment` record can be created and a Cashfree
Payment Link generated (`lib/cashfree/client.ts`) and sent to the customer.
Cashfree calls back on `/api/webhooks/cashfree`, which verifies the
HMAC-SHA256 signature against the raw request body, then marks the `Payment`
as paid and recomputes the parent `Shipment`'s payment status.

**4. Shipment tracking**
Each `Shipment` is linked to a `Carrier`. Admins can trigger a sync
(`/api/admin/shipments/[id]/sync`) which calls the configured carrier
adapter — Ship24 (covers ~1200 couriers with one API key), or direct
UPS/FedEx/DHL integrations (`lib/carriers/*`) — to pull the latest status.
Customers look up a tracking number publicly at `/track-shipment`, which hits
`/api/tracking/[number]`.

**5. Content management**
Blogs, services, testimonials, team, FAQ, homepage content, and SEO metadata
are all editable through the admin panel and stored in their own collections,
rendered on the public site via server components.

## Environment Variables

See `.env.local.example` for the full list. Required at minimum:
`MONGODB_URI`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
Optional: Cashfree keys (payments), Ship24/UPS/FedEx/DHL keys (live tracking
sync — without them, syncing that carrier fails with a clear "not configured"
error rather than crashing).

## Running Locally

```bash
npm install
npm run seed   # populates initial data
npm run dev    # http://localhost:3000
```

## Security Notes

- Admin session is a signed JWT in an httpOnly cookie — not readable by
  client JS, mitigating XSS token theft.
- Cashfree webhook signature is verified with `crypto.timingSafeEqual`
  against the **raw** request body (parsing first would break verification).
- `DEV_SKIP_AUTH` cannot activate in production regardless of its value,
  since it's gated on `NODE_ENV !== "production"`.
