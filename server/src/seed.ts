import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const email = (process.env.ADMIN_EMAIL ?? 'admin@amplified.jo').toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? 'amplified123';

db.prepare('INSERT OR IGNORE INTO admins (email, password, name) VALUES (?, ?, ?)').run(
  email,
  bcrypt.hashSync(password, 10),
  'Store manager',
);

const categories: [string, string, string, number][] = [
  ['guitars', 'Guitars', 'Electrics, acoustics and basses, set up on the bench before they ship.', 1],
  ['amplifiers', 'Amplifiers', 'Valve heads, combos and cabs. Every one of them plugged in and played.', 2],
  ['pedals', 'Pedals', 'Drive, fuzz, modulation and delay. Boutique builds and shop staples.', 3],
  ['accessories', 'Accessories', 'Strings, cables, straps, picks, cases and the parts that go missing.', 4],
];

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (slug, name, blurb, position) VALUES (?, ?, ?, ?)',
);
for (const c of categories) insertCategory.run(...c);

const catId = (slug: string) =>
  (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number }).id;

const products = [
  {
    slug: 'nightshade-s-type',
    name: 'Nightshade S-Type',
    brand: 'Amplified Custom',
    category: 'guitars',
    price: 640,
    stock: 4,
    featured: 1,
    description:
      'Alder body, roasted maple neck and a trio of hand-wound single coils. Set up with 10s and a level fret job before it leaves the bench.',
    specs: ['Alder body', 'Roasted maple neck, 9.5" radius', '3x hand-wound single coils', '2-point tremolo'],
  },
  {
    slug: 'basalt-jazz-bass',
    name: 'Basalt Jazz Bass',
    brand: 'Amplified Custom',
    category: 'guitars',
    price: 720,
    stock: 2,
    featured: 0,
    description: 'Four strings, two pickups, one very loud room. Ash body with a satin neck that plays fast.',
    specs: ['Ash body', 'Satin maple neck', '2x J-style pickups', 'Nickel roundwounds fitted'],
  },
  {
    slug: 'valvewright-30-combo',
    name: 'Valvewright 30 Combo',
    brand: 'Valvewright',
    category: 'amplifiers',
    price: 890,
    stock: 3,
    featured: 1,
    description:
      'Thirty watts of EL84 push-pull with a spring reverb tank that goes from surf splash to full drench.',
    specs: ['30W, 2x EL84', '1x12" Celestion', 'Spring reverb', 'Effects loop'],
  },
  {
    slug: 'monolith-100-head',
    name: 'Monolith 100 Head',
    brand: 'Valvewright',
    category: 'amplifiers',
    price: 1450,
    stock: 1,
    featured: 0,
    description: 'A hundred watts of clean headroom, or a filthy second channel. Bring earplugs.',
    specs: ['100W, 4x EL34', 'Two footswitchable channels', 'Series FX loop', 'Made in Amman'],
  },
  {
    slug: 'violet-haze-fuzz',
    name: 'Violet Haze Fuzz',
    brand: 'Amplified Pedals',
    category: 'pedals',
    price: 95,
    stock: 12,
    featured: 1,
    description: 'Germanium fuzz with a bias knob that takes it from spitting and gated to a wall of wool.',
    specs: ['NOS germanium transistors', 'Bias control', 'True bypass', '9V centre negative'],
  },
  {
    slug: 'tape-echo-mk2',
    name: 'Tape Echo Mk2',
    brand: 'Amplified Pedals',
    category: 'pedals',
    price: 140,
    stock: 7,
    featured: 0,
    description: 'Digital delay that wobbles like tape. Hold the footswitch for self-oscillation.',
    specs: ['30ms–1200ms', 'Wow and flutter control', 'Tap tempo', 'Trails on bypass'],
  },
  {
    slug: 'roadworn-strap',
    name: 'Roadworn Leather Strap',
    brand: 'Amplified',
    category: 'accessories',
    price: 35,
    stock: 20,
    featured: 0,
    description: 'Full-grain leather, suede backing, and it only looks better after a hundred gigs.',
    specs: ['Full-grain leather', 'Adjustable 100–140cm', 'Suede backing'],
  },
  {
    slug: 'silent-plug-cable-6m',
    name: 'Silent Plug Cable, 6m',
    brand: 'Amplified',
    category: 'accessories',
    price: 28,
    stock: 30,
    featured: 1,
    description: 'Swap guitars mid-set without the pop. Braided shield, soldered by hand.',
    specs: ['6 metres', 'Silent plug on the guitar end', 'Braided shield', 'Lifetime warranty'],
  },
];

const insertProduct = db.prepare(
  `INSERT OR IGNORE INTO products (slug, name, brand, category_id, price, stock, description, specs, images, featured)
   VALUES (@slug, @name, @brand, @category_id, @price, @stock, @description, @specs, @images, @featured)`,
);

for (const p of products) {
  insertProduct.run({
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category_id: catId(p.category),
    price: p.price,
    stock: p.stock,
    description: p.description,
    specs: JSON.stringify(p.specs),
    images: JSON.stringify([]),
    featured: p.featured,
  });
}

const reviews = [
  ['Layth K.', 5, 'Set up better than my last three guitars', 'The Nightshade arrived playing perfectly. Action was exactly where I asked, and nothing buzzed. Delivery guy waited while I checked it.'],
  ['Dana S.', 5, 'The fuzz is filthy', 'Bought the Violet Haze on a Thursday, had it Saturday morning, paid the driver cash. The bias knob is the whole pedal.'],
  ['Omar A.', 4, 'Loud, heavy, worth it', 'Monolith head is a monster. Only complaint is that I now need a bigger car.'],
];

const insertReview = db.prepare(
  'INSERT INTO reviews (product_id, author, rating, title, body, approved) VALUES (NULL, ?, ?, ?, ?, 1)',
);
const reviewCount = db.prepare('SELECT COUNT(*) AS n FROM reviews').get() as { n: number };
if (reviewCount.n === 0) for (const r of reviews) insertReview.run(...(r as [string, number, string, string]));

console.log(`Seeded. Admin login: ${email} / ${password}`);
