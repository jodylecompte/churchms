'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { LayoutDashboard, Users, Home, Baby, Calendar, MessageSquare, Settings } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'People', href: '/people', icon: Users },
  { label: 'Households', href: '/households', icon: Home },
  { label: 'Check-In', href: '/check-in', icon: Baby },
  { label: 'Volunteers', href: '/volunteers', icon: Calendar },
  { label: 'Boards', href: '/boards', icon: MessageSquare },
]

type AdminSidebarProps = {
  email: string
  role: string
}

export function AdminSidebar({ email, role }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">G</span>
          </div>
          <span className="font-semibold text-lg">GospelOS</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/settings" />}
                isActive={pathname === '/settings' || pathname.startsWith('/settings/')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <NavUser email={email} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}
