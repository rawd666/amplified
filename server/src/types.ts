export interface CategoryRow {
  id: number;
  slug: string;
  name: string;
  blurb: string;
  position: number;
}

export interface ProductRow {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_id: number;
  price: number;
  stock: number;
  description: string;
  specs: string;
  images: string;
  featured: number;
  created_at: string;
}

export interface GalleryRow {
  id: number;
  url: string;
  caption: string;
  tag: string;
  position: number;
}

export interface DemoRow {
  id: number;
  url: string;
  product_name: string;
  description: string;
  position: number;
  created_at: string;
}

export interface ReviewRow {
  id: number;
  product_id: number | null;
  author: string;
  rating: number;
  title: string;
  body: string;
  approved: number;
  created_at: string;
}

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductImage {
  url: string;
  crop?: ImageCrop;
}

/** Products store specs/images as JSON text; the API hands back real arrays.
 *  Older rows saved `images` as plain URL strings - normalize those to
 *  `{ url }` objects so every consumer sees the same shape. */
export function hydrateProduct(row: ProductRow & { category_slug?: string; category_name?: string }) {
  const rawImages = safeParse<Array<string | ProductImage>>(row.images, []);
  return {
    ...row,
    featured: Boolean(row.featured),
    specs: safeParse<string[]>(row.specs, []),
    images: rawImages.map((img): ProductImage => (typeof img === 'string' ? { url: img } : img)),
  };
}

export function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
