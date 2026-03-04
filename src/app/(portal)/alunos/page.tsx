"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Aluno, AlunoStatus, Turma, Servico } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_LABEL: Record<AlunoStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  inadimplente: "Inadimplente",
}
const STATUS_VARIANT: Record<
  AlunoStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ativo: "default",
  inativo: "outline",
  inadimplente: "destructive",
}

interface ItemSelecionado {
  id: string
  nome: string
  valor: string
}

interface AlunoComTotal extends Aluno {
  valor_total: number
}

export default function AlunosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [alunos, setAlunos] = useState<AlunoComTotal[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [diaVencimento, setDiaVencimento] = useState("10")
  const [turmasSel, setTurmasSel] = useState<ItemSelecionado[]>([])
  const [servicosSel, setServicosSel] = useState<ItemSelecionado[]>([])

  useEffect(() => {
    loadDados()
  }, [])

  async function loadDados() {
    setLoading(true)
    const [
      { data: alunosData },
      { data: turmasData },
      { data: servicosData },
      { data: atData },
      { data: asData },
    ] = await Promise.all([
      supabase.from("alunos").select("*").order("nome"),
      supabase.from("turmas").select("*").order("nome"),
      supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
      supabase.from("aluno_turmas").select("aluno_id, valor").eq("ativo", true),
      supabase.from("aluno_servicos").select("aluno_id, valor").eq("ativo", true),
    ])

    const totais: Record<string, number> = {}
    ;(atData ?? []).forEach((v: { aluno_id: string; valor: number }) => {
      totais[v.aluno_id] = (totais[v.aluno_id] ?? 0) + v.valor
    })
    ;(asData ?? []).forEach((v: { aluno_id: string; valor: number }) => {
      totais[v.aluno_id] = (totais[v.aluno_id] ?? 0) + v.valor
    })

    setAlunos(
      (alunosData ?? []).map((a) => ({ ...a, valor_total: totais[a.id] ?? 0 }))
    )
    setTurmas(turmasData ?? [])
    setServicos(servicosData ?? [])
    setLoading(false)
  }

  function resetForm() {
    setNome("")
    setWhatsapp("")
    setEmail("")
    setDiaVencimento("10")
    setTurmasSel([])
    setServicosSel([])
  }

  function toggleTurma(t: Turma) {
    setTurmasSel((prev) => {
      if (prev.find((x) => x.id === t.id)) return prev.filter((x) => x.id !== t.id)
      return [...prev, { id: t.id, nome: t.nome, valor: String(t.valor_mensalidade) }]
    })
  }

  function toggleServico(s: Servico) {
    setServicosSel((prev) => {
      if (prev.find((x) => x.id === s.id)) return prev.filter((x) => x.id !== s.id)
      return [...prev, { id: s.id, nome: s.nome, valor: String(s.valor) }]
    })
  }

  const totalSel = [...turmasSel, ...servicosSel].reduce(
    (acc, i) => acc + (parseFloat(i.valor) || 0),
    0
  )

  async function salvar() {
    if (!nome.trim() || !whatsapp.trim()) {
      toast.error("Preencha nome e WhatsApp")
      return
    }
    if (turmasSel.length === 0 && servicosSel.length === 0) {
      toast.error("Vincule ao menos uma turma ou serviço")
      return
    }

    setSalvando(true)
    try {
      const { data: novoAluno, error } = await supabase
        .from("alunos")
        .insert({
          nome: nome.trim(),
          whatsapp: whatsapp.replace(/\D/g, ""),
          email: email.trim() || null,
          dia_vencimento: parseInt(diaVencimento) || 10,
          status: "ativo",
        })
        .select()
        .single()

      if (error || !novoAluno) throw error

      if (turmasSel.length > 0) {
        await supabase.from("aluno_turmas").insert(
          turmasSel.map((t) => ({
            aluno_id: novoAluno.id,
            turma_id: t.id,
            valor: parseFloat(t.valor) || 0,
          }))
        )
      }

      if (servicosSel.length > 0) {
        await supabase.from("aluno_servicos").insert(
          servicosSel.map((s) => ({
            aluno_id: novoAluno.id,
            servico_id: s.id,
            valor: parseFloat(s.valor) || 0,
          }))
        )
      }

      // Criar cliente no Asaas (não crítico)
      fetch("/api/asaas/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno_id: novoAluno.id,
          nome: novoAluno.nome,
          whatsapp: novoAluno.whatsapp,
          email: novoAluno.email,
        }),
      }).catch(() => null)

      toast.success("Aluno cadastrado!")
      setDialogOpen(false)
      resetForm()
      loadDados()
    } catch {
      toast.error("Erro ao cadastrar aluno")
    } finally {
      setSalvando(false)
    }
  }

  const alunosFiltrados = alunos.filter((a) => {
    const matchBusca =
      busca === "" ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.whatsapp.includes(busca)
    const matchStatus = filtroStatus === "todos" || a.status === filtroStatus
    return matchBusca && matchStatus
  })

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alunos</h1>
        <Button
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou WhatsApp..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inadimplente">Inadimplentes</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="hidden md:table-cell">Mensalidade</TableHead>
              <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : alunosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum aluno encontrado.
                </TableCell>
              </TableRow>
            ) : (
              alunosFiltrados.map((aluno) => (
                <TableRow
                  key={aluno.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/alunos/${aluno.id}`)}
                >
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {aluno.whatsapp}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-medium">
                    {aluno.valor_total > 0 ? (
                      fmt(aluno.valor_total)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    Dia {aluno.dia_vencimento}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[aluno.status]}>
                      {STATUS_LABEL[aluno.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nome completo *</Label>
                <Input
                  placeholder="João Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>WhatsApp *</Label>
                  <Input
                    placeholder="19999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Dia de vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Turmas</Label>
              {turmas.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma turma cadastrada.
                </p>
              ) : (
                turmas.map((t) => {
                  const sel = turmasSel.find((x) => x.id === t.id)
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={!!sel}
                        onCheckedChange={() => toggleTurma(t)}
                      />
                      <span className="flex-1 text-sm">{t.nome}</span>
                      {sel ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            className="h-7 w-24 text-xs"
                            value={sel.valor}
                            onChange={(e) =>
                              setTurmasSel((p) =>
                                p.map((x) =>
                                  x.id === t.id
                                    ? { ...x, valor: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          R$ {t.valor_mensalidade.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Serviços</Label>
              {servicos.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum serviço cadastrado.
                </p>
              ) : (
                servicos.map((s) => {
                  const sel = servicosSel.find((x) => x.id === s.id)
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={!!sel}
                        onCheckedChange={() => toggleServico(s)}
                      />
                      <span className="flex-1 text-sm">{s.nome}</span>
                      {sel ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            className="h-7 w-24 text-xs"
                            value={sel.valor}
                            onChange={(e) =>
                              setServicosSel((p) =>
                                p.map((x) =>
                                  x.id === s.id
                                    ? { ...x, valor: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          R$ {s.valor.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {totalSel > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Total mensal</span>
                <span className="font-bold text-primary">{fmt(totalSel)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
