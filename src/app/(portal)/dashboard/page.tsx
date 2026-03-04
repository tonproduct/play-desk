"use client"

import { useEffect, useState } from "react"
import { Users, TrendingUp, AlertCircle, DollarSign, Send } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Pagamento, Aluno } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalAtivos: number
  totalInadimplentes: number
  receitaEsperada: number
  receitaRecebida: number
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  className,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  loading?: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Pagamento[]>([])
  const [inadimplentes, setInadimplentes] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

  const mesAtual = new Date().toISOString().slice(0, 7) // "2025-03"

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Alunos ativos e inadimplentes
      const { data: alunos } = await supabase
        .from("alunos")
        .select("*")
        .neq("status", "inativo")

      const totalAtivos = alunos?.filter((a) => a.status === "ativo").length ?? 0
      const totalInadimplentes =
        alunos?.filter((a) => a.status === "inadimplente").length ?? 0
      const inadimplentesList = alunos?.filter((a) => a.status === "inadimplente") ?? []

      // Pagamentos do mês atual
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("*, aluno:alunos(nome, whatsapp)")
        .eq("mes_referencia", mesAtual)
        .order("created_at", { ascending: false })

      const receitaEsperada =
        pagamentos?.reduce((acc, p) => acc + (p.valor ?? 0), 0) ?? 0
      const receitaRecebida =
        pagamentos
          ?.filter((p) => p.status === "pago")
          .reduce((acc, p) => acc + (p.valor ?? 0), 0) ?? 0

      setStats({ totalAtivos, totalInadimplentes, receitaEsperada, receitaRecebida })
      setRecentPayments(
        (pagamentos?.filter((p) => p.status === "pago").slice(0, 5) ?? []) as Pagamento[]
      )
      setInadimplentes(inadimplentesList as Aluno[])
    } finally {
      setLoading(false)
    }
  }

  async function enviarLembrete(aluno: Aluno) {
    try {
      const res = await fetch("/api/n8n/enviar-lembrete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aluno_id: aluno.id, tipo: "lembrete_3dias" }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Lembrete enviado para ${aluno.nome}`)
    } catch {
      toast.error("Erro ao enviar lembrete")
    }
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Alunos Ativos"
          value={stats?.totalAtivos ?? 0}
          icon={Users}
          description="Matrículas ativas"
          loading={loading}
        />
        <StatCard
          title="Inadimplentes"
          value={stats?.totalInadimplentes ?? 0}
          icon={AlertCircle}
          description="Pagamentos em atraso"
          loading={loading}
          className={
            (stats?.totalInadimplentes ?? 0) > 0
              ? "border-destructive/50"
              : undefined
          }
        />
        <StatCard
          title="Receita Esperada"
          value={formatCurrency(stats?.receitaEsperada ?? 0)}
          icon={TrendingUp}
          description={`Mês de ${mesAtual}`}
          loading={loading}
        />
        <StatCard
          title="Receita Recebida"
          value={formatCurrency(stats?.receitaRecebida ?? 0)}
          icon={DollarSign}
          description="Pagamentos confirmados"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos pagamentos recebidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento recebido neste mês.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {(p.aluno as { nome: string } | null)?.nome ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.mes_referencia}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(p.valor)}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700 text-xs"
                      >
                        pago
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inadimplentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inadimplentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : inadimplentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aluno inadimplente.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {inadimplentes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Venc. dia {a.dia_vencimento}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => enviarLembrete(a)}
                    >
                      <Send className="h-3 w-3" />
                      Lembrete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
