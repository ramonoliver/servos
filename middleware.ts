import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "servos_auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendario",
  "/configuracoes",
  "/escalas",
  "/eventos",
  "/indisponibilidade",
  "/membros",
  "/mensagens",
  "/minhas-escalas",
  "/ministerios",
  "/notificacoes",
  "/onboarding",
  "/perfil",
  "/relatorios",
  "/repertorio",
];

const AUTH_PAGES = ["/login", "/cadastro"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = Boolean(req.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
