"use client";

import { useState } from "react";
import { AnnouncementBar } from "./announcement-bar";
import { TopBar } from "./top-bar";
import { Navbar } from "./navbar";
import { MobileDrawer } from "./mobile-drawer";
import { BottomNavBar } from "./bottom-nav";

type NavCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
type NavBrand = { id: string; name: string; logoUrl: string | null };
type SessionUser = { id: string; name: string | null; email: string | null; image: string | null; role: string } | null;

interface Props {
  categories: NavCategory[];
  brands: NavBrand[];
  user: SessionUser;
  announcement: string;
  wishlistCount: number;
}

export function StorefrontHeader({ categories, brands, user, announcement, wishlistCount }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <TopBar user={user} />
      <AnnouncementBar message={announcement} id="v1" />
      <div className="sticky top-0 z-30">
        <Navbar
          categories={categories}
          brands={brands}
          user={user}
          onMenuOpen={() => setDrawerOpen(true)}
        />
      </div>
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        user={user}
      />
      <BottomNavBar
        onCategoryOpen={() => setDrawerOpen(true)}
        onSearchOpen={() => {
          setDrawerOpen(false);
          setMobileSearchOpen(true);
          // Focus search input via DOM
          setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
            if (input) { input.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }
          }, 100);
        }}
        wishlistCount={wishlistCount}
        isLoggedIn={!!user}
      />
    </>
  );
}
