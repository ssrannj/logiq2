# Mangala Showroom

A full-stack premium furniture and electronics showroom app built with React (Vite) frontend and Spring Boot (Java) backend.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS v4, running on port 5000
- **Backend**: Spring Boot 3.3.5 + Spring Security + JWT, running on port 8080
- **Database**: PostgreSQL (Replit built-in)
- **Authentication**: JWT-based auth with role support (ADMIN / USER)

## Project Structure

```
/
├── frontend/           # React + Vite app (port 5000)
│   ├── src/
│   │   ├── pages/      # HomePage, CatalogPage, CheckoutPage, TrackingPage, AuthPage, AdminDashboard, CustomerDashboard, LogiqBrain
│   │   ├── components/ # ProtectedRoute, etc.
│   │   ├── context/    # AuthContext, CartContext
│   │   └── services/   # api.js (axios, proxied through Vite to :8080)
│   └── vite.config.js  # host: 0.0.0.0, port: 5000, allowedHosts: true, proxy /api -> :8080
├── backend/            # Spring Boot app (port 8080)
│   ├── src/main/java/com/mangala/showroom/
│   │   ├── controller/ # AuthController, ProductController, OrderController, WishlistController, CategoryController, UserController
│   │   ├── model/      # User, Product, Order, Wishlist, Role, OrderStatus, Category
│   │   ├── repository/ # JPA repositories
│   │   ├── security/   # JWT, Spring Security config
│   │   ├── service/    # Business logic
│   │   └── config/     # WebConfig (CORS), DataInitializer (seeds data)
│   └── src/main/resources/application.properties  # PostgreSQL config via env vars
└── maven/              # Local Maven 3.9.9 installation
```

## Admin Dashboard Tabs
- **Overview**: Sales stats, priority orders board, LogiQ Brain shortcut
- **Inventory**: Full product table with Warranty column; Add/Edit/Delete products (includes warranty months field)
- **Orders**: Order status pipeline with functional dropdown (has visual arrow indicator)
- **Categories**: Root + subcategory management
- **Customer Database**: Live table of all registered users fetched from `GET /api/user/admin/all`
- **Role Management**: Staff access control with 6 role templates, per-permission toggles, add/deactivate staff

## LogiQ Brain v2.0 Modules (all share state)
1. **Dashboard** — overview with fleet health, top priority orders
2. **Urge Queue** — priority-scored delivery queue, "View Order" detail modal, explains assignment logic, driver assignment
3. **Route Planner** — create routes, add stops linked to pending orders, view order per stop, mark stops done
4. **Vehicle Capacity** — select vehicle + orders → real-time weight analysis + distance tier earnings
5. **Stock Distribution** — product-level distribution; select product → allocate qty to each branch; per-branch inventory toggle
6. **Inter-Branch Requests** — multi-item select from source branch inventory, click to view branch inventory, approve/reject/transit/deliver
7. **QR Dispatch** — generate signed token + QR code per order; dispatch feeds dispatchLog used by Driver Bonus
8. **Damage Tickets** — predefined damage type dropdown (12 categories, auto-sets severity), photo evidence, quarantine/resolve
9. **Driver Cash Collection** — COD deposit recording with signature; shows open damage tickets per driver
10. **Accountant Reconciliation** — daily ledger balancing, pending wallet tracking, settle mismatches
11. **Driver Bonus** — formula: base pay by distance tier + on-time 10% + max daily Rs.500 + rating multiplier (0.8–1.2) − damage penalties; fully connected to dispatch log and ratings
12. **Customer Rating** — post-delivery feedback feed; average directly feeds driver bonus multiplier

## Backend API Endpoints
- `GET /api/user/admin/all` — Admin-only; returns all registered users with id, name, email, fullName, phoneNumber, address, role, points, totalOrders

## Workflows

- **Start application** (webview, port 5000): `cd frontend && npm run dev`
- **Backend API** (console, port 8080): Maven spring-boot:run

## Key Configuration

- Frontend API calls proxied through Vite to avoid CORS issues in dev
- Backend uses PostgreSQL via `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` env vars
- CORS configured to allow all origins (`allowedOriginPatterns("*")`)
- Database schema auto-managed by Hibernate (`ddl-auto=update`)
- Seed data (products + admin user) auto-loaded via `DataInitializer`

## Email (Resend)

- Email is sent via **Resend REST API** (not SMTP) — `spring-boot-starter-mail` is NOT used
- API key stored as `RESEND_API_KEY` secret, read via `resend.api.key` property
- FROM address defaults to `onboarding@resend.dev` (works for testing, sends only to account owner)
- **To send to real customer emails**: verify a domain in Resend dashboard (resend.com), then set `MAIL_FROM` env var to `noreply@yourdomain.com`
- Email triggers: order status → "Order Confirmed" (payment verified), wishlist back-in-stock scheduler

## Maven

Maven is bundled at `/home/runner/workspace/maven/apache-maven-3.9.9`.
Always set `MAVEN_HOME` and update `PATH` before running mvn commands:
```bash
export MAVEN_HOME=/home/runner/workspace/maven/apache-maven-3.9.9
export PATH=$MAVEN_HOME/bin:$PATH
```
