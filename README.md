<div align="center">
  <img width="1000" alt="QuickVet Preview" src="preview.jpg" />
  <h1>QuickVet</h1>
  <p><strong>Find nearby veterinarians, book appointments, and request emergency pet care — all in one platform.</strong></p>

  ![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
  ![Version](https://img.shields.io/badge/Version-1.0.0-blue)
<<<<<<< docs/readme-and-license
  ![License](https://img.shields.io/badge/License-MIT-yellow)
=======
  ![License](https://img.shields.io/badge/License-Private-lightgrey)
>>>>>>> main
</div>

---

## Project Status

| Area | Status | Notes |
|------|--------|-------|
| Frontend (React SPA) | :white_check_mark: Complete | All views, modals, and dashboards functional |
| Backend (Express API) | :white_check_mark: Complete | Full REST API with JWT auth |
| Database (PostgreSQL) | :white_check_mark: Complete | 7-table schema with Drizzle ORM |
| Authentication | :white_check_mark: Complete | Signup, login, password reset, role-based access |
| Booking System | :white_check_mark: Complete | Clinic visits & home visits with status management |
| Emergency Alerts | :white_check_mark: Complete | Real-time emergency request/response flow |
| Interactive Map | :white_check_mark: Complete | Leaflet-based with geolocation & routing |
| Clinic Reviews | :white_check_mark: Complete | Star ratings with dynamic averages |
| Vet Dashboard | :white_check_mark: Complete | Manage bookings & emergencies |
| User Dashboard | :white_check_mark: Complete | Pet profiles, favorites, booking history |
| AI Symptom Checker | :construction: Planned | Gemini API integration (key configured) |
| Deployment | :white_check_mark: Ready | Vercel (frontend) + Render (backend) split |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              React 19 SPA (Vite + Tailwind CSS 4)             │  │
│  │                                                               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌───────────────┐  │  │
│  │  │  Home   │ │ Find Vets│ │ Emergency  │ │  Dashboards   │  │  │
│  │  │  Hero   │ │ Map View │ │  Widget    │ │ (User / Vet)  │  │  │
│  │  └─────────┘ └──────────┘ └────────────┘ └───────────────┘  │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  Shared: AuthModal, BookingModal, ReviewsModal,         │  │  │
│  │  │          VetRegistrationModal, Navbar, Footer            │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                     fetch() + Bearer JWT                             │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                            │
│                                                                     │
│  ┌────────────────┐  ┌───────────────┐  ┌───────────────────────┐  │
│  │  CORS + JSON   │  │  JWT Auth     │  │  Role-Based Access    │  │
│  │  Middleware     │  │  Middleware   │  │  Control Middleware   │  │
│  └────────────────┘  └───────────────┘  └───────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     REST API Routes                            │  │
│  │                                                               │  │
│  │  PUBLIC:        /api/auth/*        (signup, login, reset)     │  │
│  │                 /api/clinics        (list all clinics)        │  │
│  │                 /api/clinics/:id/reviews  (read reviews)      │  │
│  │                                                               │  │
│  │  PROTECTED:     /api/bookings      (CRUD, tenant-isolated)   │  │
│  │  (JWT)          /api/emergency     (CRUD, role-scoped)       │  │
│  │                 /api/user/*        (profile, pets, favorites) │  │
│  │                 /api/clinics       (POST - create clinic)     │  │
│  │                                                               │  │
│  │  VET-ONLY:      /api/bookings/:id/status                     │  │
│  │                 /api/emergency/:id/status                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                    Drizzle ORM Queries                               │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                             │
│                                                                     │
│  ┌────────────┐ ┌───────┐ ┌──────┐ ┌─────────────────────────────┐ │
│  │ vet_clinics│ │ users │ │ pets │ │ favorite_clinics (join)     │ │
│  └────────────┘ └───────┘ └──────┘ └─────────────────────────────┘ │
│  ┌────────────────┐ ┌──────────┐ ┌─────────────────────────────┐   │
│  │ clinic_reviews │ │ bookings │ │ emergency_requests          │   │
│  └────────────────┘ └──────────┘ └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---
<<<<<<< docs/readme-and-license

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI component library |
| **Vite 6** | Build tool & dev server (middleware mode) |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page transitions & animations |
| **Leaflet** | Interactive maps with markers & routing |
| **Lucide React** | Icon library |
| **canvas-confetti** | Celebration animations |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express 4** | HTTP server & REST API |
| **Drizzle ORM** | Type-safe PostgreSQL queries & migrations |
| **bcryptjs** | Password hashing (10 salt rounds) |
| **Custom JWT (HS256)** | Token-based authentication (no external lib) |
| **dotenv** | Environment configuration |

### Database
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary relational database |
| **Drizzle Kit** | Schema migrations & studio |
| **pg (node-postgres)** | Connection pooling (max 20 connections) |

### DevOps / Tooling
| Technology | Purpose |
|-----------|---------|
| **TypeScript 5.8** | End-to-end type safety |
| **tsx** | Development server runner |
| **esbuild** | Production server bundling |
| **Drizzle Studio** | Database GUI for development |

---

## Database Schema

7 tables with full referential integrity:

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────┐
│  vet_clinics │◄──────│ favorite_clinics  │──────►│    users    │
│              │       │   (join table)    │       │             │
│  id (PK)     │       └──────────────────┘       │  id (PK)    │
│  name        │                                   │  email (UQ) │
│  address     │◄──┐                               │  role       │
│  area        │   │                               │  clinicId   │──┐
│  latitude    │   │   ┌──────────────────┐       └─────────────┘  │
│  longitude   │   ├───│  clinic_reviews   │              │         │
│  rating      │   │   └──────────────────┘              │         │
│  specialists │   │                                      ▼         │
│  services    │   │   ┌──────────────────┐       ┌─────────────┐  │
│  hasEmergency│   ├───│    bookings      │──────►│    pets     │  │
│  hasHomeVisit│   │   └──────────────────┘       └─────────────┘  │
└──────────────┘   │                                                │
        ▲          │   ┌──────────────────┐                        │
        │          └───│emergency_requests │                        │
        │              └──────────────────┘                        │
        └──────────────────────────────────────────────────────────┘
```

| Table | Records | Description |
|-------|---------|-------------|
| `vet_clinics` | Clinic profiles | Vet clinic directory with geo-coords, services, and ratings |
| `users` | User accounts | Pet owners & veterinarians with role-based access |
| `pets` | Pet profiles | Owner's pets with breed, age, weight, medical history |
| `favorite_clinics` | M:N join | Users can favorite/bookmark clinics |
| `clinic_reviews` | Star reviews | 1-5 star ratings with text feedback per clinic |
| `bookings` | Appointments | Clinic visits & home visits with status tracking |
| `emergency_requests` | SOS alerts | Emergency requests with location & acceptance workflow |

---

## API Routes

### Public (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/auth/reset-password` | Reset user password |
| `GET` | `/api/clinics` | List all registered clinics |
| `GET` | `/api/clinics/:id/reviews` | Get reviews for a clinic |

### Protected (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/me` | Get current user profile |
| `POST` | `/api/user/pets` | Add a pet to profile |
| `POST` | `/api/user/favorites` | Toggle clinic favorite |
| `POST` | `/api/clinics` | Register a new clinic |
| `POST` | `/api/clinics/:id/reviews` | Submit a clinic review |
| `GET` | `/api/bookings` | Get user/clinic bookings |
| `POST` | `/api/bookings` | Create a new booking |
| `GET` | `/api/emergency` | Get emergency requests |
| `POST` | `/api/emergency` | Submit emergency request |

### Veterinarian Only (JWT + Role Guard)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings/:id/status` | Update booking status |
| `POST` | `/api/emergency/:id/status` | Accept/update emergency |

---

## Project Structure

```
QuickVet/
├── server.ts                    # Express server entry point (API + Vite middleware)
├── vite.config.ts               # Vite build config (React + Tailwind)
├── drizzle.config.ts            # Drizzle Kit migration config
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── index.html                   # SPA entry HTML
├── .env.example                 # Environment variable template
├── LICENSE                      # MIT License
│
├── src/
│   ├── App.tsx                  # Main app component (routing, state, views)
│   ├── main.tsx                 # React DOM entry
│   ├── index.css                # Global styles + Tailwind imports
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── data.ts                  # Utility functions (Haversine distance, etc.)
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Top navigation with role-aware links
│   │   ├── Hero.tsx             # Landing page hero section
│   │   ├── InteractiveMap.tsx   # Leaflet map with clinic markers
│   │   ├── ClinicCard.tsx       # Clinic listing card component
│   │   ├── BookingModal.tsx     # Appointment booking form
│   │   ├── ReviewsModal.tsx     # Clinic reviews viewer/writer
│   │   ├── EmergencyWidget.tsx  # Emergency SOS submission form
│   │   ├── AuthModal.tsx        # Login/signup modal
│   │   ├── UserDashboard.tsx    # Pet owner dashboard
│   │   ├── VetDashboard.tsx     # Veterinarian management dashboard
│   │   ├── VetRegistrationModal.tsx  # New clinic registration form
│   │   └── Footer.tsx           # Page footer
│   │
│   └── server/
│       ├── db.ts                # PostgreSQL pool + Drizzle instance
│       ├── schema.ts            # Drizzle ORM table definitions & relations
│       ├── jwt.ts               # Custom HS256 JWT sign/verify (zero-dep)
│       ├── middleware.ts        # Auth & role-guard Express middleware
│       └── seed.ts              # Database seeding script
│
├── public/
│   ├── favicon.png
│   └── apple-touch-icon.png
│
└── assets/
    └── preview.svg
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended)
- **PostgreSQL** 14+ (local or cloud — Railway, Neon, Supabase, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/Abhishek-gupta18/QuickVet.git
cd QuickVet
```

=======

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI component library |
| **Vite 6** | Build tool & dev server (middleware mode) |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page transitions & animations |
| **Leaflet** | Interactive maps with markers & routing |
| **Lucide React** | Icon library |
| **canvas-confetti** | Celebration animations |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express 4** | HTTP server & REST API |
| **Drizzle ORM** | Type-safe PostgreSQL queries & migrations |
| **bcryptjs** | Password hashing (10 salt rounds) |
| **Custom JWT (HS256)** | Token-based authentication (no external lib) |
| **dotenv** | Environment configuration |

### Database
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary relational database |
| **Drizzle Kit** | Schema migrations & studio |
| **pg (node-postgres)** | Connection pooling (max 20 connections) |

### DevOps / Tooling
| Technology | Purpose |
|-----------|---------|
| **TypeScript 5.8** | End-to-end type safety |
| **tsx** | Development server runner |
| **esbuild** | Production server bundling |
| **Drizzle Studio** | Database GUI for development |

---

## Database Schema

7 tables with full referential integrity:

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────┐
│  vet_clinics │◄──────│ favorite_clinics  │──────►│    users    │
│              │       │   (join table)    │       │             │
│  id (PK)     │       └──────────────────┘       │  id (PK)    │
│  name        │                                   │  email (UQ) │
│  address     │◄──┐                               │  role       │
│  area        │   │                               │  clinicId   │──┐
│  latitude    │   │   ┌──────────────────┐       └─────────────┘  │
│  longitude   │   ├───│  clinic_reviews   │              │         │
│  rating      │   │   └──────────────────┘              │         │
│  specialists │   │                                      ▼         │
│  services    │   │   ┌──────────────────┐       ┌─────────────┐  │
│  hasEmergency│   ├───│    bookings      │──────►│    pets     │  │
│  hasHomeVisit│   │   └──────────────────┘       └─────────────┘  │
└──────────────┘   │                                                │
        ▲          │   ┌──────────────────┐                        │
        │          └───│emergency_requests │                        │
        │              └──────────────────┘                        │
        └──────────────────────────────────────────────────────────┘
```

| Table | Records | Description |
|-------|---------|-------------|
| `vet_clinics` | Clinic profiles | Vet clinic directory with geo-coords, services, and ratings |
| `users` | User accounts | Pet owners & veterinarians with role-based access |
| `pets` | Pet profiles | Owner's pets with breed, age, weight, medical history |
| `favorite_clinics` | M:N join | Users can favorite/bookmark clinics |
| `clinic_reviews` | Star reviews | 1-5 star ratings with text feedback per clinic |
| `bookings` | Appointments | Clinic visits & home visits with status tracking |
| `emergency_requests` | SOS alerts | Emergency requests with location & acceptance workflow |

---

## API Routes

### Public (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/auth/reset-password` | Reset user password |
| `GET` | `/api/clinics` | List all registered clinics |
| `GET` | `/api/clinics/:id/reviews` | Get reviews for a clinic |

### Protected (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/me` | Get current user profile |
| `POST` | `/api/user/pets` | Add a pet to profile |
| `POST` | `/api/user/favorites` | Toggle clinic favorite |
| `POST` | `/api/clinics` | Register a new clinic |
| `POST` | `/api/clinics/:id/reviews` | Submit a clinic review |
| `GET` | `/api/bookings` | Get user/clinic bookings |
| `POST` | `/api/bookings` | Create a new booking |
| `GET` | `/api/emergency` | Get emergency requests |
| `POST` | `/api/emergency` | Submit emergency request |

### Veterinarian Only (JWT + Role Guard)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings/:id/status` | Update booking status |
| `POST` | `/api/emergency/:id/status` | Accept/update emergency |

---

## Project Structure

```
QuickVet/
├── server.ts                    # Express server entry point (API + Vite middleware)
├── vite.config.ts               # Vite build config (React + Tailwind)
├── drizzle.config.ts            # Drizzle Kit migration config
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── index.html                   # SPA entry HTML
├── .env.example                 # Environment variable template
│
├── src/
│   ├── App.tsx                  # Main app component (routing, state, views)
│   ├── main.tsx                 # React DOM entry
│   ├── index.css                # Global styles + Tailwind imports
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── data.ts                  # Utility functions (Haversine distance, etc.)
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Top navigation with role-aware links
│   │   ├── Hero.tsx             # Landing page hero section
│   │   ├── InteractiveMap.tsx   # Leaflet map with clinic markers
│   │   ├── ClinicCard.tsx       # Clinic listing card component
│   │   ├── BookingModal.tsx     # Appointment booking form
│   │   ├── ReviewsModal.tsx     # Clinic reviews viewer/writer
│   │   ├── EmergencyWidget.tsx  # Emergency SOS submission form
│   │   ├── AuthModal.tsx        # Login/signup modal
│   │   ├── UserDashboard.tsx    # Pet owner dashboard
│   │   ├── VetDashboard.tsx     # Veterinarian management dashboard
│   │   ├── VetRegistrationModal.tsx  # New clinic registration form
│   │   └── Footer.tsx           # Page footer
│   │
│   └── server/
│       ├── db.ts                # PostgreSQL pool + Drizzle instance
│       ├── schema.ts            # Drizzle ORM table definitions & relations
│       ├── jwt.ts               # Custom HS256 JWT sign/verify (zero-dep)
│       ├── middleware.ts        # Auth & role-guard Express middleware
│       └── seed.ts              # Database seeding script
│
├── public/
│   ├── favicon.png
│   └── apple-touch-icon.png
│
└── assets/
    └── preview.svg
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended)
- **PostgreSQL** 14+ (local or cloud — Railway, Neon, Supabase, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/Abhishek-gupta18/QuickVet.git
cd QuickVet
```

>>>>>>> main
### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quickvet"
JWT_SECRET="your-strong-random-secret-min-32-chars"
FRONTEND_URL="http://localhost:5173"
VITE_API_URL=""
```

### 4. Set up the database

```bash
# Push schema to PostgreSQL
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
<<<<<<< docs/readme-and-license
```

### 5. Start the development server

```bash
npm run dev
```

=======
```

### 5. Start the development server

```bash
npm run dev
```

>>>>>>> main
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Express + Vite middleware) |
| `npm run build` | Build for production (Vite frontend + esbuild server) |
| `npm start` | Run production server |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Drizzle Studio GUI |

---

## Deployment
<<<<<<< docs/readme-and-license

QuickVet is designed for a **split deployment**:

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | **Vercel** | Set `VITE_API_URL` to backend URL |
| Backend | **Render** | Set all env vars (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`) |
| Database | **Railway / Neon** | Managed PostgreSQL |

=======

QuickVet is designed for a **split deployment**:

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | **Vercel** | Set `VITE_API_URL` to backend URL |
| Backend | **Render** | Set all env vars (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`) |
| Database | **Railway / Neon** | Managed PostgreSQL |

>>>>>>> main
### Production Build

```bash
npm run build
npm start
```

The build outputs:
- `dist/` — Static frontend assets (deploy to Vercel/CDN)
- `dist/server.cjs` — Bundled Express server (deploy to Render/Railway)

---

## Key Design Decisions

- **Custom JWT implementation** — Zero-dependency HS256 token signing/verification using Node.js `crypto` module. No `jsonwebtoken` package needed.
- **Tenant isolation** — Bookings and emergencies are scoped by user email (pet owners) or clinic ID (veterinarians). No cross-tenant data leakage.
- **Vite middleware mode** — In development, Vite runs as Express middleware for a single-port experience (API + SPA on port 3000).
- **Geolocation-first UX** — Auto-detects user location on load; Haversine distance calculation for radius-based clinic filtering.
- **Optimistic polling** — Client polls `/api/bookings` and `/api/emergency` every 6 seconds for near-real-time updates without WebSocket complexity.
- **Role-based views** — `pet_owner` and `veterinarian` roles see different dashboards and have different API permissions enforced at middleware level.

---

<<<<<<< docs/readme-and-license
## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

=======
>>>>>>> main
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">
<<<<<<< docs/readme-and-license
  <p>Built with 💚 for pet parents in Bengaluru</p>
=======
  <p>Built with :green_heart: for pet parents in Bengaluru</p>
>>>>>>> main
</div>
