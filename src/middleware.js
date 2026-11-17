import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isPathMatch(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const authMiddleware = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (!user || !user.id || !user.role) {
    if (
      isPathMatch(pathname, "/admin") ||
      isPathMatch(pathname, "/seller") ||
      isPathMatch(pathname, "/buyer")
    ) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      const returnTo = `${pathname}${search || ""}`;
      if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
        loginUrl.searchParams.set("callbackUrl", returnTo);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (user.role === "admin") {
    if (
      pathname === "/" ||
      isPathMatch(pathname, "/products") ||
      isPathMatch(pathname, "/buyer") ||
      isPathMatch(pathname, "/seller") ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (user.role === "seller") {
    if (user.seller_status === "approved") {
      if (
        pathname === "/" ||
        isPathMatch(pathname, "/products") ||
        isPathMatch(pathname, "/buyer") ||
        isPathMatch(pathname, "/seller/pending") ||
        pathname === "/seller" ||
        isPathMatch(pathname, "/admin") ||
        pathname === "/login" ||
        pathname === "/register"
      ) {
        return NextResponse.redirect(
          new URL("/seller/dashboard", req.nextUrl.origin)
        );
      }
      return NextResponse.next();
    }

    if (!isPathMatch(pathname, "/seller/pending")) {
      return NextResponse.redirect(
        new URL("/seller/pending", req.nextUrl.origin)
      );
    }
    return NextResponse.next();
  }

  if (user.role === "buyer") {
    if (
      isPathMatch(pathname, "/admin") ||
      isPathMatch(pathname, "/seller") ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/buyer"
    ) {
      return NextResponse.redirect(new URL("/buyer/home", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export default async function middleware(req, event) {
  const res = await authMiddleware(req, event);
  // Next.js strips `_rsc` / `next-router-prefetch` before invoking middleware,
  // but background RSC/Link prefetches still carry `next-url` and
  // `sec-fetch-dest: empty`. Avoid rotating/re-setting session cookies on
  // those background requests so they cannot race with and undo signOut().
  const isRscPrefetch =
    Boolean(req.headers.get("next-url")) &&
    req.headers.get("sec-fetch-dest") === "empty";

  if (res && isRscPrefetch) {
    res.headers.delete("set-cookie");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|uploads|placeholders|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$|.*\\.ico$).*)",
  ],
};
