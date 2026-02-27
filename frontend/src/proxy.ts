import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "buena_auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page and static assets through
  if (pathname === "/login") return NextResponse.next();

  // If AUTH_SECRET is not configured (local dev), skip auth entirely
  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token === secret) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
