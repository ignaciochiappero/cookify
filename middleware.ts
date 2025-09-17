import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');
    const isRecipesPage = req.nextUrl.pathname.startsWith('/recipes');
    const isMealPlannerPage = req.nextUrl.pathname.startsWith('/meal-planner');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

    // Si está en página de auth y ya está autenticado, redirigir al dashboard
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Si no está autenticado y trata de acceder a páginas protegidas
    if (!isAuth && (isDashboardPage || isRecipesPage || isMealPlannerPage || isAdminPage)) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Si está autenticado pero no es admin y trata de acceder a admin
    if (isAuth && isAdminPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
        const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');
        const isRecipesPage = req.nextUrl.pathname.startsWith('/recipes');
        const isMealPlannerPage = req.nextUrl.pathname.startsWith('/meal-planner');
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

        // Permitir acceso a páginas de auth sin token
        if (isAuthPage) {
          return true;
        }

        // Requerir token para páginas protegidas
        if (isDashboardPage || isRecipesPage || isMealPlannerPage) {
          return !!token;
        }

        // Requerir token y rol admin para páginas de admin
        if (isAdminPage) {
          return !!token && token.role === 'ADMIN';
        }

        // Permitir acceso a otras páginas
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
