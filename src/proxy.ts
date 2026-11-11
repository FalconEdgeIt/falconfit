import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "./lib/auth";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];
// Open to everyone, signed in or not
const OPEN_PATHS = ["/coaches"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();

  // Visitors who aren't signed in see the coaches landing page at the front door
  if (!session && pathname === "/") {
    return NextResponse.rewrite(new URL("/coaches", request.url));
  }

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Excludes API routes (they guard themselves via requireUser) and any request
// for a static file (favicon, public/ images, etc — anything with a dot in the path).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
