import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, Product } from '../lib/types';

const KEY = 'amplified.cart';

interface CartValue {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<CartValue>(() => {
    const add = (product: Product, qty = 1) => {
      setLines((prev) => {
        const found = prev.find((l) => l.product_id === product.id);
        if (found) {
          return prev.map((l) =>
            l.product_id === product.id ? { ...l, qty: Math.min(l.qty + qty, product.stock || 99) } : l,
          );
        }
        return [
          ...prev,
          {
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            qty,
            image: product.images[0],
          },
        ];
      });
      setOpen(true);
    };

    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
      open,
      setOpen,
      add,
      setQty: (productId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.product_id !== productId)
            : prev.map((l) => (l.product_id === productId ? { ...l, qty } : l)),
        ),
      remove: (productId) => setLines((prev) => prev.filter((l) => l.product_id !== productId)),
      clear: () => setLines([]),
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
