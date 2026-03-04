"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Menu,
  X,
  Volleyball,
  LogOut,
  Dumbbell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/turmas", label: "Turmas", icon: Volleyball },
  { href: "/servicos", label: "Serviços", icon: Dumbbell },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 px-1 py-3">
        <Volleyball className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Arena Manager</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href}
            onClick={onNav}
          />
        ))}
      </nav>
      <div className="border-t pt-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Volleyball className="h-5 w-5 text-primary" />
          <span className="font-bold">Arena Manager</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl">
            <div className="flex items-center justify-end p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
