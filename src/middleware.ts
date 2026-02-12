import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/dashboard/:path*', '/files/:path*', '/api/upload/:path*', '/api/files/:path*', '/api/folders/:path*'],
}
