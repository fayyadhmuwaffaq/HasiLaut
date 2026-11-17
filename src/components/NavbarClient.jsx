"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CartIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/Icons";
import SignOutButton from "@/components/ui/SignOutButton";

const EXACT_MATCH_PATHS = new Set([
  "/",
  "/admin",
  "/seller/dashboard",
  "/seller/pending",
  "/buyer/home",
  "/login",
  "/register",
]);

function isNavItemActive(pathname, href) {
  if (EXACT_MATCH_PATHS.has(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavConfig(user) {
  if (!user) {
    return {
      homeHref: "/",
      showSearch: true,
      links: [
        { href: "/products", label: "Katalog" },
        { href: "/login", label: "Masuk" },
        { href: "/register", label: "Daftar", emphasis: "primary" },
      ],
    };
  }

  if (user.role === "admin") {
    return {
      homeHref: "/admin",
      showSearch: false,
      links: [
        { href: "/admin", label: "Verifikasi" },
        { href: "/admin/categories", label: "Kategori" },
        { href: "/admin/users", label: "Pengguna" },
        { href: "/admin/products", label: "Produk" },
      ],
    };
  }

  if (user.role === "seller") {
    if (user.seller_status === "approved") {
      return {
        homeHref: "/seller/dashboard",
        showSearch: false,
        links: [
          { href: "/seller/dashboard", label: "Ringkasan" },
          { href: "/seller/dashboard/products", label: "Produk" },
          { href: "/seller/dashboard/orders", label: "Pesanan" },
          { href: "/seller/dashboard/store", label: "Profil Lapak" },
        ],
      };
    }
    return {
      homeHref: "/seller/pending",
      showSearch: false,
      links: [{ href: "/seller/pending", label: "Status Akun" }],
    };
  }

  return {
    homeHref: "/buyer/home",
    showSearch: true,
    links: [
      { href: "/products", label: "Katalog" },
      { href: "/buyer/cart", label: "Keranjang", isCart: true },
      { href: "/buyer/orders", label: "Pesanan" },
      { href: "/buyer/profile", label: "Profil" },
    ],
  };
}

export default function NavbarClient({ user, cartCount = 0 }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const { homeHref, showSearch, links } = getNavConfig(user);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeDrawer() {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <header className="w-full h-[72px] bg-[#FFFFFF] border-b border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <Link
            href={homeHref}
            className="text-[22px] font-bold tracking-tight text-[#0284C7] shrink-0 py-1"
          >
            HasiLaut
          </Link>

          {showSearch ? (
            <form
              action="/products"
              method="GET"
              role="search"
              className="hidden md:flex items-center flex-1 max-w-[380px] min-w-0"
            >
              <label htmlFor="navbar-search-desktop" className="sr-only">
                Cari hasil laut
              </label>
              <input
                id="navbar-search-desktop"
                name="q"
                type="search"
                placeholder="Cari ikan, udang, cumi..."
                className="h-[44px] w-full min-w-0 rounded-l-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
              <button
                type="submit"
                aria-label="Cari hasil laut"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-r-md border border-l-0 border-[#0369A1] bg-[#0369A1] text-[#FFFFFF] hover:bg-[#075985] transition-colors"
              >
                <SearchIcon size={18} />
              </button>
            </form>
          ) : null}
        </div>

        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-4 shrink-0">
          {links.map((item) => {
            const active = isNavItemActive(pathname, item.href);

            if (item.emphasis === "primary") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-4 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center gap-2 px-2 text-[15px] whitespace-nowrap transition-colors ${
                  active
                    ? "font-semibold text-[#0369A1] border-b-2 border-[#0369A1]"
                    : "font-medium text-[#334155] hover:text-[#0369A1]"
                }`}
              >
                {item.isCart ? <CartIcon size={18} /> : null}
                <span>{item.label}</span>
                {item.isCart && cartCount > 0 ? (
                  <span className="inline-flex min-w-[24px] h-[24px] items-center justify-center rounded-md bg-[#B91C1C] px-1.5 text-[13px] font-semibold text-[#FFFFFF] tabular-nums">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {user?.role === "admin" ? (
            <Link
              href="/admin/account"
              aria-current={
                isNavItemActive(pathname, "/admin/account") ? "page" : undefined
              }
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-md border px-3 py-2 text-[14px] font-medium whitespace-nowrap transition-colors ${
                isNavItemActive(pathname, "/admin/account")
                  ? "border-[#0369A1] bg-[#F0F9FF] font-semibold text-[#0369A1]"
                  : "border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#0369A1] hover:text-[#0369A1]"
              }`}
            >
              <UserIcon size={16} />
              <span>Kata Sandi</span>
            </Link>
          ) : null}

          {user ? <SignOutButton /> : null}
        </nav>

        <div className="flex items-center gap-2 lg:hidden shrink-0">
          {user?.role === "buyer" ? (
            <Link
              href="/buyer/cart"
              aria-label={
                cartCount > 0
                  ? `Keranjang belanja (${cartCount} item)`
                  : "Keranjang belanja"
              }
              className="relative inline-flex h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[#E2E8F0] px-2.5 text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <CartIcon size={20} />
              {cartCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-md bg-[#B91C1C] px-1.5 text-[13px] font-semibold text-[#FFFFFF] tabular-nums">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 py-2 text-[15px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <MenuIcon size={18} />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/45 lg:hidden"
          onClick={closeDrawer}
        >
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            onClick={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-[340px] flex-col bg-[#FFFFFF] border-l border-[#E2E8F0] p-5 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <span className="text-[20px] font-bold text-[#0284C7]">
                HasiLaut
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Tutup menu"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[14px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <CloseIcon size={18} />
                <span>Tutup</span>
              </button>
            </div>

            {showSearch ? (
              <form
                action="/products"
                method="GET"
                role="search"
                onSubmit={() => setMenuOpen(false)}
                className="mt-5 flex items-center"
              >
                <label htmlFor="navbar-search-mobile" className="sr-only">
                  Cari hasil laut
                </label>
                <input
                  id="navbar-search-mobile"
                  name="q"
                  type="search"
                  placeholder="Cari ikan, udang, cumi..."
                  className="h-[44px] w-full min-w-0 rounded-l-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B]"
                />
                <button
                  type="submit"
                  aria-label="Cari hasil laut"
                  className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-r-md border border-l-0 border-[#0369A1] bg-[#0369A1] text-[#FFFFFF] hover:bg-[#075985]"
                >
                  <SearchIcon size={18} />
                </button>
              </form>
            ) : null}

            <nav aria-label="Menu navigasi seluler" className="mt-5 flex flex-col gap-2">
              {links.map((item) => {
                const active = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[44px] items-center justify-between rounded-md px-3.5 py-2.5 text-[16px] ${
                      item.emphasis === "primary"
                        ? "bg-[#0369A1] font-semibold text-[#FFFFFF] hover:bg-[#075985]"
                        : active
                          ? "border-l-4 border-[#0369A1] bg-[#F0F9FF] font-semibold text-[#0369A1]"
                          : "font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.isCart && cartCount > 0 ? (
                      <span className="inline-flex min-w-[24px] h-[24px] items-center justify-center rounded-md bg-[#B91C1C] px-2 text-[13px] font-semibold text-[#FFFFFF] tabular-nums">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {user ? (
              <div className="mt-6 border-t border-[#E2E8F0] pt-5 flex flex-col gap-3">
                <p className="text-[14px] text-[#475569]">
                  Masuk sebagai{" "}
                  <span className="font-semibold text-[#0F172A]">
                    {user.full_name}
                  </span>
                </p>
                {user.role === "admin" ? (
                  <Link
                    href="/admin/account"
                    onClick={() => setMenuOpen(false)}
                    aria-current={
                      isNavItemActive(pathname, "/admin/account")
                        ? "page"
                        : undefined
                    }
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    <UserIcon size={17} />
                    <span>Keamanan & Kata Sandi</span>
                  </Link>
                ) : null}
                <SignOutButton
                  className="w-full"
                  onBeforeSignOut={() => setMenuOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
