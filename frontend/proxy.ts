import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const path = url.pathname;
  
  const isProd = process.env.NODE_ENV === "production";
  const baseDomain = isProd ? "nexflow.vaibhavr.xyz" : "localhost.direct:3002";
  const protocol = isProd ? "https" : "http";
  
  const subdomain = hostname.replace(baseDomain, "").replace(".", "");
  const isBaseDomain = subdomain === "";
  const isPublicPath = path === '/login' || path === '/register';
  const isAllowedPath = path === '/about' || path === '/'; 

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // --- THE ROUTING LOGIC ---

  if (!token) {
    if (!isPublicPath && !isAllowedPath) {
      return NextResponse.redirect(new URL('/login', `${protocol}://${baseDomain}`));
    }
    return NextResponse.next();
  }

  const userTenant = token.accountName as string;

  if (isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', `${protocol}://${userTenant}.${baseDomain}`));
  }

  if (isBaseDomain) {
     return NextResponse.redirect(new URL('/dashboard', `${protocol}://${userTenant}.${baseDomain}`));
  }

  if (subdomain !== userTenant) {
    return NextResponse.redirect(new URL(`${path}${url.search}`, `${protocol}://${userTenant}.${baseDomain}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}