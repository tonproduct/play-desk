"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Pagamento, PagamentoStatus, Turma } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

const STATUS_STYLE: Record<PagamentoStatus, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  pago: {
    label: "Pago",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  vencido: {
    label: "Vencido",
    className: "border-red-200 bg-red-50 text-red-700",
  },
}

interface PagamentoComJoin extends Omit<Pagamento, "aluno"> {
  aluno: {
    nome: string
    turma: { nome: string } | null
  } | null
}

export default function PagamentosPage() {
  const supabase = createClient()
  const [pagamentos, setPagamentos] = useState<PagamentoComJoin[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroTurma, setFiltroTurma] = useState("todas")

  useEffect(() => {
    loadPagamentos()
  }, [filtroMes])

  async function loadPagamentos() {
    setLoading(true)
    const [{ data: pagData }, { data: turmasData }] = await Promise.all([
      supabase
        .from("pagamentos")
        .select(
          "*, aluno:alunos(nome, turma:turmas(nome))"
        )
        .eq("mes_referencia", filtroMes)
        .order("data_vencimento", { ascending: true }),
      supabase.from("turmas").select("*").order("nome"),
    ])

    setPagamentos((pagData ?? []) as PagamentoComJoin[])
    setTurmas(turmasData ?? [])
    setLoading(false)
  }

  const pagFiltrados = pagamentos.filter((p) => {
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus
    const matchTurma =
      filtroTurma === "todas" || p.aluno?.turma?.nome === filtroTurma
    return matchStatus && matchTurma
  })

  const totalPago = pagFiltrados
    .filter((p) => p.status === "pago")
    .reduce((acc, p) => acc + p.valor, 0)
  const totalPendente = pagFiltrados
    .filter((p) => p.status !== "pago")
    .reduce((acc, p) => acc + p.valor, 0)

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pagamentos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="month"
          className="w-44"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTurma} onValueChange={setFiltroTurma}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={t.nome}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo */}
      {!loading && (
        <div className="flex flex-wrap gap-4 text-sm">
          <Card className="flex items-center gap-2 px-4 py-2">
            <span className="text-muted-foreground">Recebido:</span>
            <span className="font-bold text-green-600">{fmt(totalPago)}</span>
          </Card>
          <Card className="flex items-center gap-2 px-4 py-2">
            <span className="text-muted-foreground">Pendente:</span>
            <span className="font-bold text-yellow-600">{fmt(totalPendente)}</span>
          </Card>
          <Card className="flex items-center gap-2 px-4 py-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">{fmt(totalPago + totalPendente)}</span>
          </Card>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden sm:table-cell">Turma</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="hidden md:table-cell">Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagFiltrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum pagamento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              pagFiltrados.map((p) => {
                const style = STATUS_STYLE[p.status]
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.aluno?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.aluno?.turma?.nome ?? "—"}
                    </TableCell>
                    <TableCell>{p.mes_referencia}</TableCell>
                    <TableCell className="font-medium">
                      {p.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={style.className}>
                        {style.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {p.data_vencimento
                        ? new Date(
                            p.data_vencimento + "T00:00:00"
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {p.data_pagamento
                        ? new Date(p.data_pagamento).toLocaleDateString(
                            "pt-BR"
                          )
                        : "—"}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
