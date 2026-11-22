"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CartIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
} from "@/components/ui/Icons";

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
    ],
  };
}

function getProfileMenuConfig(user) {
  if (!user) {
    return null;
  }

  if (user.role === "buyer") {
    return {
      roleLabel: "Pembeli",
      items: [
        { type: "link", href: "/buyer/orders", label: "Pesanan Saya" },
        { type: "link", href: "/buyer/profile", label: "Edit Profil" },
        { type: "signout", label: "Keluar" },
      ],
    };
  }

  if (user.role === "admin") {
    return {
      roleLabel: "Administrator",
      items: [
        { type: "link", href: "/admin/account", label: "Profile" },
        { type: "signout", label: "Keluar" },
      ],
    };
  }

  const sellerProfileHref =
    user.seller_status === "approved"
      ? "/seller/dashboard/store"
      : "/seller/pending";

  return {
    roleLabel: "Mitra Nelayan",
    items: [
      { type: "link", href: sellerProfileHref, label: "Profile" },
      { type: "signout", label: "Keluar" },
    ],
  };
}

function getFirstInitial(fullName) {
  const firstWord =
    typeof fullName === "string" ? fullName.trim().split(/\s+/)[0] : "";
  const firstChar = firstWord.charAt(0).toUpperCase();
  return firstChar || "U";
}

function ProfileAvatarDropdown({ user, pathname }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const menuConfig = getProfileMenuConfig(user);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!menuConfig) {
    return null;
  }

  const firstInitial = getFirstInitial(user.full_name);

  function handleMenuKeyDown(event, index) {
    const total = menuConfig.items.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      itemRefs.current[(index + 1) % total]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      itemRefs.current[(index - 1 + total) % total]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      itemRefs.current[total - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Menu profil ${user.full_name}`}
        className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border bg-[#FFFFFF] p-0.5 transition-colors ${
          open
            ? "border-[#0369A1] ring-2 ring-[#0284C7]/20"
            : "border-[#CBD5E1] hover:border-[#0369A1]"
        }`}
      >
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt=""
            width={38}
            height={38}
            className="h-[38px] w-[38px] rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#0369A1] text-[15px] font-bold text-[#FFFFFF] select-none"
          >
            {firstInitial}
          </span>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Menu akun pengguna"
          className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] py-1.5 z-50"
        >
          <div className="border-b border-[#E2E8F0] px-4 py-2.5">
            <p className="truncate text-[14px] font-semibold text-[#0F172A]">
              {user.full_name}
            </p>
            <p className="text-[13px] text-[#475569]">{menuConfig.roleLabel}</p>
          </div>

          <div className="py-1">
            {menuConfig.items.map((item, index) => {
              if (item.type === "signout") {
                return (
                  <button
                    key={item.label}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={handleSignOut}
                    onKeyDown={(e) => handleMenuKeyDown(e, index)}
                    className="flex min-h-[44px] w-full items-center px-4 py-2.5 text-left text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50 transition-colors"
                  >
                    {signingOut ? "Keluar..." : item.label}
                  </button>
                );
              }

              const active = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  onKeyDown={(e) => handleMenuKeyDown(e, index)}
                  className={`flex min-h-[44px] items-center px-4 py-2.5 text-[15px] transition-colors ${
                    active
                      ? "bg-[#F0F9FF] font-semibold text-[#0369A1]"
                      : "font-medium text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0369A1]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NavbarClient({ user, cartCount = 0 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCatalogQ =
    pathname === "/products" ? searchParams.get("q") || "" : "";
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
            className="inline-flex min-h-[44px] items-center gap-2.5 text-[20px] sm:text-[22px] font-bold tracking-tight text-[#0284C7] shrink-0 py-1"
          >
            <Image
              src="/logo.png"
              alt=""
              width={549}
              height={227}
              preload
              fetchPriority="high"
              className="h-6 sm:h-7 w-auto"
            />
            <span>HasiLaut</span>
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
                key={`nav-q-desktop-${pathname}-${activeCatalogQ}`}
                id="navbar-search-desktop"
                name="q"
                type="search"
                defaultValue={activeCatalogQ}
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <nav
            aria-label="Navigasi utama"
            className="hidden lg:flex items-center gap-4"
          >
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
          </nav>

          {user?.role === "buyer" ? (
            <Link
              href="/buyer/cart"
              aria-label={
                cartCount > 0
                  ? `Keranjang belanja (${cartCount} item)`
                  : "Keranjang belanja"
              }
              className="lg:hidden relative inline-flex h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[#E2E8F0] px-2.5 text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <CartIcon size={20} />
              {cartCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-md bg-[#B91C1C] px-1.5 text-[13px] font-semibold text-[#FFFFFF] tabular-nums">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {user ? (
            <ProfileAvatarDropdown user={user} pathname={pathname} />
          ) : null}

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label="Buka menu navigasi"
            className="lg:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md border border-[#64748B] bg-[#FFFFFF] px-2.5 sm:px-3.5 py-2 text-[15px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <MenuIcon size={18} />
            <span className="hidden sm:inline">Menu</span>
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
              <span className="inline-flex items-center gap-2 text-[20px] font-bold text-[#0284C7]">
                <Image
                  src="/logo.png"
                  alt=""
                  width={549}
                  height={227}
                  className="h-6 w-auto"
                />
                <span>HasiLaut</span>
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
                  key={`nav-q-mobile-${pathname}-${activeCatalogQ}`}
                  id="navbar-search-mobile"
                  name="q"
                  type="search"
                  defaultValue={activeCatalogQ}
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
