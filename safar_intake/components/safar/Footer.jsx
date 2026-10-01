'use client';
// Global footer — removed per navigation refactor.
// All footer content (Company / Legal / Support / Connect / Contact links)
// has been relocated into the top-nav "More" menu (see Navbar.jsx).
// This component is kept as a no-op export so the ~125 pages/components that
// import <Footer /> continue to compile without any changes to those files.
export default function Footer() {
  return null;
}
