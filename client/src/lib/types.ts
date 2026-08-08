export interface Category {
  id: number;
  slug: string;
  name: string;
  blurb: string;
  position: number;
  product_count?: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_id: number;
  category_slug: string;
  category_name: string;
  price: number;
  stock: number;
  description: string;
  specs: string[];
  images: string[];
  featured: boolean;
  created_at: string;
}

export interface GalleryShot {
  id: number;
  url: string;
  caption: string;
  tag: string;
  position: number;
}

export interface Review {
  id: number;
  product_id: number | null;
  product_name?: string | null;
  product_slug?: string | null;
  author: string;
  rating: number;
  title: string;
  body: string;
  approved: number;
  created_at: string;
}

export interface CartLine {
  product_id: number;
  slug: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Order {
  id: number;
  reference: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  items: CartLine[];
  total: number;
  fulfilment: 'delivery' | 'pickup';
  slot_date: string;
  slot_time: string;
  status: string;
  created_at: string;
}

export interface Booking {
  id: number;
  reference: string;
  customer: string;
  phone: string;
  reason: string;
  interest: string;
  slot_date: string;
  slot_time: string;
  notes: string;
  status: string;
  created_at: string;
}

export interface Admin {
  id: number;
  email: string;
  name: string;
}
