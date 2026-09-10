import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { Role } from "@/lib/constants";

const { auth } = NextAuth(authConfig);

const ROLE_HOME: Record<string, string> = {
  [Role.PATIENT]: "/patient/dashboard",
  [Role.PRACTITIONER]: "/practitioner/dashboard",
  [Role.NGO]: "/ngo/dashboard",
  [Role.ADMIN]: "/admin/dashboard",
};

const ROLE_ROUTES: Record<string, string[]> = {
  [Role.PATIENT]: ["/patient"],
  [Role.PRACTITIONER]: ["/practitioner"],
  [Role.NGO]: ["/ngo"],
  [Role.ADMIN]: ["/admin"],
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const userRole = user?.role;

  const isPatientRoute = pathname.startsWith("/patient");
  const isPractitionerRoute = pathname.startsWith("/practitioner");
  const isNgoRoute = pathname.startsWith("/ngo");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = isPatientRoute || isPractitionerRoute || isNgoRoute || isAdminRoute;

  // Unauthenticated users trying to access protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role mismatch protection (e.g. Patient trying to access /practitioner or /ngo)
  if (user && userRole) {
    if (isPatientRoute && userRole !== Role.PATIENT) {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? "/", req.url));
    }
    if (isPractitionerRoute && userRole !== Role.PRACTITIONER) {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? "/", req.url));
    }
    if (isNgoRoute && userRole !== Role.NGO) {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? "/", req.url));
    }
    if (isAdminRoute && userRole !== Role.ADMIN) {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? "/", req.url));
    }

    // Authenticated users on login/register pages
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? "/", req.url));
    }
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
