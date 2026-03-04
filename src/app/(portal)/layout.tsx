import { AppSidebar } from "@/components/app-sidebar"

// Força renderização dinâmica em todas as rotas do portal (requer env vars em runtime)
export const dynamic = "force-dynamic"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
