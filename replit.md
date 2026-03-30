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
│   │   ├── pages/      # HomePage, CatalogPage, CheckoutPage, TrackingPage, AuthPage, AdminDashboard, CustomerDashboard
│   │   ├── components/ # ProtectedRoute, etc.
│   │   ├── context/    # AuthContext, CartContext
│   │   └── services/   # api.js (axios, proxied through Vite to :8080)
│   └── vite.config.js  # host: 0.0.0.0, port: 5000, allowedHosts: true, proxy /api -> :8080
├── backend/            # Spring Boot app (port 8080)
│   ├── src/main/java/com/mangala/showroom/
│   │   ├── controller/ # AuthController, ProductController, OrderController, WishlistController, CategoryController
│   │   ├── model/      # User, Product, Order, Wishlist, Role, OrderStatus, Category
│   │   ├── repository/ # JPA repositories
│   │   ├── security/   # JWT, Spring Security config
│   │   ├── service/    # Business logic
│   │   └── config/     # WebConfig (CORS), DataInitializer (seeds data)
│   └── src/main/resources/application.properties  # PostgreSQL config via env vars
└── maven/              # Local Maven 3.9.9 installation
```

## Workflows

- **Start application** (webview, port 5000): `cd frontend && npm run dev`
- **Backend API** (console, port 8080): Maven spring-boot:run

## Key Configuration

- Frontend API calls proxied through Vite to avoid CORS issues in dev
- Backend uses PostgreSQL via `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` env vars
- CORS configured to allow all origins (`allowedOriginPatterns("*")`)
- Database schema auto-managed by Hibernate (`ddl-auto=update`)
- Seed data (products + admin user) auto-loaded via `DataInitializer`

## Maven

Maven is bundled at `/home/runner/workspace/maven/apache-maven-3.9.9`.
Always set `MAVEN_HOME` and update `PATH` before running mvn commands:
```bash
export MAVEN_HOME=/home/runner/workspace/maven/apache-maven-3.9.9
export PATH=$MAVEN_HOME/bin:$PATH
```
