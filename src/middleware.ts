import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function decodeJwtPayload(
  token: string,
): { exp?: number; isAdmin?: boolean } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { exp?: number; isAdmin?: boolean };
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const { pathname } = request.nextUrl;
  const accessValid = Boolean(token && !isAccessTokenExpired(token));
  const canRestoreSession =
    accessValid || Boolean(refreshToken) || Boolean(token);

  const protectedRoutes = ["/dashboard", "/admin"];

  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) &&
    !canRestoreSession
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    (pathname === "/login" || pathname === "/register" || pathname === "/") &&
    accessValid &&
    token
  ) {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      const response = NextResponse.next();
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }

    if (payload.isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
