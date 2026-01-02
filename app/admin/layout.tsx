import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session from cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  let userEmail: string | null = null;
  try {
    if (sessionCookie?.value) {
      const decoded = JSON.parse(atob(sessionCookie.value));
      userEmail = decoded.email;
    }
  } catch {
    // Invalid cookie
  }

  if (!userEmail) {
    redirect('/login?redirect=/admin');
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  if (!['admin', 'super_admin', 'reviewer'].includes(user.role)) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
