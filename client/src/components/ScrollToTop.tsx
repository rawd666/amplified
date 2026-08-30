import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router keeps the scroll position when the path changes, which leaves
// a new page scrolled to wherever the previous one was. Reset to the top on
// every navigation, but leave in-page hash links (#section) alone.
// `behavior: 'instant'` overrides the global `scroll-behavior: smooth`, so the
// jump is immediate instead of animating up from the bottom of the old page.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
