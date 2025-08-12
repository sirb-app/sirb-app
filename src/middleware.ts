import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/profile",
  "/admin/dashboard",
  "/dashboard",
  "/subjects/[^/]+/chapters",
];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const sessionCookie = getSessionCookie(req);

  const res = NextResponse.next();

  const isLoggedIn = !!sessionCookie;

  const isOnProtectedRoute = protectedRoutes.some(route => {
    if (route.includes("[^/]+")) {
      // Handle dynamic routes with regex
      const regex = new RegExp(`^${route.replace(/\[\^\/\]\+/g, "[^/]+")}.*$`);
      return regex.test(nextUrl.pathname);
    }
    // Handle exact routes
    return (
      nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
    );
  });

  const isOnAuthRoute = nextUrl.pathname.startsWith("/auth");

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isOnAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
