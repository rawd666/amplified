import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Store from './pages/Store';
import ProductDetail from './pages/ProductDetail';
import Gallery from './pages/Gallery';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';

import ReviewsLayout from './pages/reviews/ReviewsLayout';
import AllReviews from './pages/reviews/AllReviews';
import WriteReview from './pages/reviews/WriteReview';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminGallery from './pages/admin/AdminGallery';
import AdminReviews from './pages/admin/AdminReviews';
import AdminOrders from './pages/admin/AdminOrders';

import { api } from './lib/api';
import type { Category } from './lib/types';

export default function App() {
  // The admin lives behind its own chrome - no shop header, no cart.
  const isAdmin = useLocation().pathname.startsWith('/admin');

  // Categories drive the store submenus, so they are fetched once and shared.
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="/admin/*" element={<AdminLogin />} />
      </Routes>
    );
  }

  return (
    <>
      <Header categories={categories} />
      <CartDrawer />
      <main>
        <Routes>
          <Route path="/" element={<Home categories={categories} />} />
          <Route path="/store" element={<Store categories={categories} />} />
          <Route path="/store/:category" element={<Store categories={categories} />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/checkout" element={<Checkout />} />

          <Route path="/reviews" element={<ReviewsLayout />}>
            <Route index element={<AllReviews />} />
            <Route path="write" element={<WriteReview />} />
          </Route>

          <Route
            path="*"
            element={<div className="empty">That page is not on the wall. Try the store.</div>}
          />
        </Routes>
      </main>
      <Footer categories={categories} />
    </>
  );
}
