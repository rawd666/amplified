# Amplified — guitars, amps, pedals, accessories

A full ecommerce site for a guitar shop, styled like the faceplate of a vintage amp: brushed grey
panels, silkscreened labels, one glowing purple jewel lamp.

- **Storefront** — store with category submenus, gallery, reviews section with its own submenu
- **Categories** — guitars, amplifiers, pedals, accessories (editable from the admin)
- **Checkout** — **cash on delivery only**, choose delivery or a booked in‑store pickup slot
- **Bookings** — book the back room for a try‑out, setup, repair or lesson (one booking per slot)
- **Instagram DMs** — linked from the header, footer, cart, product pages and every receipt
- **Admin** — token‑protected back office for categories, products, product images, gallery photos,
  review moderation, orders and bookings

## Stack

| Layer | Choice |
| --- | --- |
| Client | React 18 + TypeScript + Vite + React Router |
| Server | Express + TypeScript, better-sqlite3, JWT, multer, zod |
| Storage | SQLite file (`server/data.sqlite`), images on disk in `server/uploads` |

## Run it

```bash
npm install
cp server/.env.example server/.env   # set JWT_SECRET and the admin credentials
npm run seed                         # creates the admin, 4 categories, 8 products, 3 reviews
npm run dev                          # api on :4000, site on :5173
```

Open http://localhost:5173. The admin is at http://localhost:5173/admin.

**Seeded admin:** `admin@amplified.jo` / `amplified123` — change these in `server/.env` before you
seed, or change the password from the API (`POST /api/auth/password`) after.

Production:

```bash
npm run build
npm start      # Express serves the API and the built client on :4000
```

## Project tree

```
amplified/
├─ package.json                    workspaces + dev/build/seed scripts
├─ .gitignore
├─ README.md
├─ server/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ uploads/                     product + gallery images land here
│  └─ src/
│     ├─ index.ts                  express app, static files, error handler
│     ├─ db.ts                     sqlite schema + reference generator
│     ├─ auth.ts                   signToken + requireAdmin middleware
│     ├─ types.ts                  row types, hydrateProduct, slugify
│     ├─ seed.ts                   admin, categories, demo products, reviews
│     └─ routes/
│        ├─ auth.ts                login, me, change password
│        ├─ categories.ts          CRUD (delete blocked while products remain)
│        ├─ products.ts            CRUD + ?category= ?q= ?featured= filters
│        ├─ uploads.ts             multer image upload + gallery CRUD
│        ├─ reviews.ts             public post, admin approve/delete
│        └─ orders.ts              COD orders + booking slots
└─ client/
   ├─ package.json
   ├─ tsconfig.json
   ├─ tsconfig.node.json
   ├─ vite.config.ts               proxies /api and /uploads to :4000
   ├─ index.html
   ├─ public/
   │  ├─ guitar.svg
   │  └─ logo.png
   └─ src/
      ├─ main.tsx                  providers + stylesheets
      ├─ App.tsx                   routes (shop chrome vs admin chrome)
      ├─ styles/
      │  ├─ global.css             design system: tokens, panels, knobs, lamp
      │  └─ admin.css              back office: rail, tables, modal, dropzone
      ├─ lib/
      │  ├─ api.ts                 fetch wrapper + token + Instagram constants
      │  ├─ types.ts               shared shapes
      │  └─ format.ts              money, dates, booking slots
      ├─ context/
      │  ├─ CartContext.tsx        localStorage cart + drawer
      │  └─ AuthContext.tsx        admin session
      ├─ components/
      │  ├─ Header.tsx             faceplate nav with Store + Reviews submenus
      │  ├─ Footer.tsx             links + Instagram DM button
      │  ├─ CartDrawer.tsx
      │  ├─ ProductCard.tsx
      │  ├─ StarRating.tsx
      │  ├─ Lightbox.tsx
      │  ├─ ImageUploader.tsx      admin dropzone
      │  └─ AdminRoute.tsx
      └─ pages/
         ├─ Home.tsx               hero amp panel, categories, featured gear
         ├─ Store.tsx              /store and /store/:category
         ├─ ProductDetail.tsx
         ├─ Gallery.tsx            tag filter + lightbox
         ├─ Booking.tsx            book the back room
         ├─ Checkout.tsx           cash on delivery, delivery or pickup slot
         ├─ reviews/
         │  ├─ ReviewsLayout.tsx   submenu + outlet
         │  ├─ AllReviews.tsx
         │  └─ WriteReview.tsx
         └─ admin/
            ├─ AdminLogin.tsx
            ├─ AdminLayout.tsx
            ├─ AdminProducts.tsx
            ├─ AdminCategories.tsx
            ├─ AdminGallery.tsx
            ├─ AdminReviews.tsx
            └─ AdminOrders.tsx
```

## API

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | admin |
| POST | `/api/auth/password` | admin |
| GET | `/api/categories` | public |
| POST/PUT/DELETE | `/api/categories/:id` | admin |
| GET | `/api/products` `?category= &q= &featured=1` | public |
| GET | `/api/products/:slug` | public |
| POST/PUT/DELETE | `/api/products/:id` | admin |
| POST | `/api/uploads` (multipart `images`) | admin |
| GET | `/api/gallery` | public |
| POST/DELETE | `/api/gallery/:id` | admin |
| GET | `/api/reviews` `?product=` | public (approved only) |
| GET | `/api/reviews?all=1` | admin |
| POST | `/api/reviews` | public (queued for moderation) |
| PATCH/DELETE | `/api/reviews/:id` | admin |
| POST | `/api/orders` | public — returns `FL-XXXXX` |
| GET/PATCH | `/api/orders` | admin |
| GET | `/api/bookings/taken?date=` | public |
| POST | `/api/bookings` | public — returns `BK-XXXXX` |
| GET/PATCH | `/api/bookings` | admin |

## Notes before going live

- Swap `INSTAGRAM_HANDLE` in `client/src/lib/api.ts` for the real handle — the DM deep link
  (`https://ig.me/m/<handle>`) is built from it.
- Uploads are stored on the local disk. On a platform with an ephemeral filesystem, point multer at
  S3 or a similar bucket instead.
- New reviews arrive unapproved and stay invisible until a staff member publishes them.
