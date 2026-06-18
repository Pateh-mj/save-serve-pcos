import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  PRACTITIONER: "/practitioner/dashboard",
  NGO: "/ngo/dashboard",
  ADMIN: "/admin/dashboard",
};

const PROTECTED_PREFIXES = [
  "/patient",
  "/practitioner",
  "/ngo",
  "/admin",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    const role = req.auth.user?.role ?? "PATIENT";
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
