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

/** Products store specs/images as JSON text; the API hands back real arrays. */
export function hydrateProduct(row: ProductRow & { category_slug?: string; category_name?: string }) {
  return {
    ...row,
    featured: Boolean(row.featured),
    specs: safeParse<string[]>(row.specs, []),
    images: safeParse<string[]>(row.images, []),
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
