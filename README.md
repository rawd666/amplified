# Amplified - guitars, amps, pedals, accessories

A full ecommerce site for a guitar shop, styled like the faceplate of a vintage amp: brushed grey
panels, silkscreened labels, one glowing purple jewel lamp.

**Live:** [amplified-jo.com](https://amplified-jo.com)

- **Storefront** - store with a side "Store" menu (categories that expand into subcategories),
  gallery organized into admin-managed folders, gear demo clips, reviews with a write-your-own form
- **Categories & subcategories** - two levels deep; a category with subcategories becomes a pure
  folder (no products directly in it) and its stock count rolls up from its subcategories
- **Product images** - vertical 3:2 crop per image, with drag-to-reposition and zoom in the admin;
  the original uploaded file is never touched, only the chosen framing is stored
- **Checkout** - **cash on delivery only**, choose delivery or a booked in‑store pickup slot
  (12:00-19:00)
- **Bookings** - book the back room for a try‑out, setup & repairs, or to sell a piece, one booking
  per slot (12:00-19:00)
- **Gallery folders** - admin-managed, created/renamed/deleted inline; photos can be re-filed into a
  different folder, or have their caption/photo replaced, after upload
- **Gear demos** - video clips per product, with a lightbox player
- **Instagram DMs** - linked from the header, footer, cart, product pages and every receipt
- **Admin** - token‑protected back office for products (with image cropping), categories &
  subcategories, gallery photos & folders, gear demos, review moderation, orders and bookings

## Stack

| Layer | Choice |
| --- | --- |
| Client | React 18 + TypeScript + Vite + React Router, react-easy-crop for image framing |
| Server | Express + TypeScript, better-sqlite3, JWT, multer, zod |
| Storage | SQLite file (`server/data/data.sqlite`), images on disk in `server/uploads` |

## Run it

```bash
npm install
cp server/.env.example server/.env   # set JWT_SECRET and the admin credentials
npm run seed                         # creates the admin, 4 categories, 8 products, 3 reviews
npm run dev                          # api on :4000, site on :5173
```

Open http://localhost:5173. The admin is at http://localhost:5173/admin.

**Seeded admin:** `admin@amplified.jo` / `amplified123` - change these in `server/.env` before you
seed, or change the password from the API (`POST /api/auth/password`) after.

Production (bare metal):

```bash
npm run build
npm start      # Express serves the API and the built client on :4000
```

Production (Docker):

```bash
docker compose build
docker compose up -d
```

The SQLite database and uploaded images live in two named volumes (`amplified_dbdata`,
`amplified_uploads`), mounted at `server/data` and `server/uploads` inside the container - kept
separate from the app code so an image rebuild never wipes them. `docker-compose.yml` also ships
Traefik labels and an `edge-traefik` external network wired for this project's own deployment;
if you don't run Traefik with a network by that name, remove the `labels`/`networks` blocks (or add
a `ports: ["4000:4000"]` mapping) and adjust to your own setup.

## Project tree

```
amplified/
├─ package.json                    workspaces + dev/build/seed scripts
├─ Dockerfile                      multi-stage build -> single Express image
├─ docker-compose.yml              volumes + Traefik labels for this project's deployment
├─ .gitignore
├─ README.md
├─ server/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ uploads/                     product + gallery images land here
│  ├─ data/                        sqlite file lives here (data/data.sqlite)
│  └─ src/
│     ├─ index.ts                  express app, static files, error handler
│     ├─ db.ts                     sqlite schema, in-place migrations, reference generator
│     ├─ auth.ts                   signToken + requireAdmin middleware
│     ├─ mailer.ts                 order-notification email (no-op if SMTP is unset)
│     ├─ types.ts                  row types, hydrateProduct, slugify
│     ├─ seed.ts                   admin, categories, demo products, reviews
│     └─ routes/
│        ├─ auth.ts                login, me, change password
│        ├─ categories.ts          CRUD, subcategories (parent_id), rolled-up stock counts
│        ├─ products.ts            CRUD + ?category= ?q= ?featured= filters
│        ├─ uploads.ts             multer image/video upload + gallery photo CRUD
│        ├─ gallery-categories.ts  gallery folder CRUD (delete blocked while photos remain)
│        ├─ demos.ts               gear demo video CRUD
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
      │  └─ admin.css              back office: rail, tables, modal, dropzone, folder chips
      ├─ lib/
      │  ├─ api.ts                 fetch wrapper + token + Instagram constants
      │  ├─ types.ts                shared shapes
      │  ├─ format.ts               money, dates, booking slots (SLOTS: 12:00-19:00)
      │  └─ crop.ts                 ProductImage/ImageCrop types + getCropStyle()
      ├─ context/
      │  ├─ CartContext.tsx        localStorage cart + drawer
      │  └─ AuthContext.tsx        admin session
      ├─ components/
      │  ├─ Header.tsx             faceplate nav; "Store" opens the StoreMenu drawer
      │  ├─ StoreMenu.tsx          side drawer: categories that expand into subcategories
      │  ├─ Footer.tsx             links + Instagram DM button
      │  ├─ CartDrawer.tsx
      │  ├─ ProductCard.tsx
      │  ├─ StarRating.tsx
      │  ├─ Lightbox.tsx           photo gallery lightbox
      │  ├─ VideoLightbox.tsx      gear demo video lightbox
      │  ├─ ImageUploader.tsx      admin dropzone (gallery photos, plain string URLs)
      │  ├─ ProductImageUploader.tsx  admin dropzone with crop/reposition modal
      │  ├─ VideoUploader.tsx      admin dropzone for gear demo clips
      │  ├─ ReviewForm.tsx
      │  └─ AdminRoute.tsx
      └─ pages/
         ├─ Home.tsx               hero amp panel, categories, featured gear
         ├─ Store.tsx              /store and /store/:category (subcategory tiles or products)
         ├─ ProductDetail.tsx
         ├─ Gallery.tsx            folder filter chips + lightbox
         ├─ Booking.tsx            book the back room
         ├─ Checkout.tsx           cash on delivery, delivery or pickup slot
         ├─ reviews/
         │  ├─ AllReviews.tsx
         │  ├─ WriteReview.tsx
         │  └─ VideoDemos.tsx      gear demo clips
         └─ admin/
            ├─ AdminLogin.tsx
            ├─ AdminLayout.tsx
            ├─ AdminProducts.tsx     leaf-only category picker, image crop/reposition
            ├─ AdminCategories.tsx   category + subcategory management
            ├─ AdminGallery.tsx      folder chips (create/rename/delete), per-photo edit
            ├─ AdminVideoDemos.tsx
            ├─ AdminReviews.tsx
            └─ AdminOrders.tsx
```

## API

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | admin |
| POST | `/api/auth/password` | admin |
| GET | `/api/categories` | public - includes subcategories; a parent's `product_count` rolls up its children's |
| POST/PUT/DELETE | `/api/categories/:id` | admin - `parent_id` for subcategories, max 2 levels deep |
| GET | `/api/products` `?category= &q= &featured=1` | public |
| GET | `/api/products/:slug` | public |
| POST/PUT/DELETE | `/api/products/:id` | admin - `images: [{ url, crop? }]` |
| POST | `/api/uploads` (multipart `images`) | admin - returns image URLs |
| POST | `/api/uploads/video` (multipart `video`) | admin - returns one video URL |
| DELETE | `/api/uploads?url=` | admin - removes a file from disk |
| GET | `/api/gallery` | public - each photo includes its folder's slug/name |
| POST/PUT/DELETE | `/api/gallery/:id` | admin - PUT edits caption, folder, or replaces the photo |
| GET | `/api/gallery-categories` | public - folders, each with a rolled-up `photo_count` |
| POST/PUT/DELETE | `/api/gallery-categories/:id` | admin - delete blocked while photos remain |
| GET | `/api/demos` | public |
| POST/DELETE | `/api/demos/:id` | admin |
| GET | `/api/reviews` `?product=` | public (approved only) |
| GET | `/api/reviews?all=1` | admin |
| POST | `/api/reviews` | public (queued for moderation) |
| PATCH/DELETE | `/api/reviews/:id` | admin |
| POST | `/api/orders` | public - returns `FL-XXXXX` |
| GET/PATCH | `/api/orders` | admin |
| GET | `/api/bookings/taken?date=` | public |
| POST | `/api/bookings` | public - returns `BK-XXXXX` |
| GET/PATCH | `/api/bookings` | admin |

## Notes before going live

- Swap `INSTAGRAM_HANDLE` in `client/src/lib/api.ts` for the real handle - the DM deep link
  (`https://ig.me/m/<handle>`) is built from it.
- Set a real `JWT_SECRET` in `server/.env`. `server/src/auth.ts` falls back to a hardcoded
  `dev-secret-change-me` string if the env var is missing - fine for local dev, not for production,
  since that fallback is sitting in the public repo.
- Uploads and the SQLite file are stored on local disk, persisted through the Docker volumes in
  `docker-compose.yml`. On a platform with no persistent disk at all, point multer at S3 or a
  similar bucket instead.
- New reviews arrive unapproved and stay invisible until a staff member publishes them.
