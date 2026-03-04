import { AppSidebar } from "@/components/app-sidebar"

export const dynamic = "force-dynamic"

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
