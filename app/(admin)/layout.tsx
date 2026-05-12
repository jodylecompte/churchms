import { redirect } from 'next/navigation'
import { getSession } from '@/auth/session'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/features/shared/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session.userId) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AdminSidebar email={session.email} role={session.systemRole} />
      <main className="flex flex-1 flex-col min-h-screen">
        <header className="flex h-14 items-center border-b px-4 gap-2 bg-background">
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
