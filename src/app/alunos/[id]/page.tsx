"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, Plus, UserX, Pencil, Check, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type {
  Aluno,
  Pagamento,
  Turma,
  Servico,
  AlunoTurma,
  AlunoServico,
  AlunoStatus,
  PagamentoStatus,
} from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_PAG: Record<PagamentoStatus, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  pago: { label: "Pago", className: "border-green-200 bg-green-50 text-green-700" },
  vencido: { label: "Vencido", className: "border-red-200 bg-red-50 text-red-700" },
}

export default function AlunoDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [alunoTurmas, setAlunoTurmas] = useState<AlunoTurma[]>([])
  const [alunoServicos, setAlunoServicos] = useState<AlunoServico[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [turmasDisp, setTurmasDisp] = useState<Turma[]>([])
  const [servicosDisp, setServicosDisp] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", dia_vencimento: "10" })
  const [salvando, setSalvando] = useState(false)
  const [confirmarInativo, setConfirmarInativo] = useState(false)
  const [dialogCobranca, setDialogCobranca] = useState(false)
  const [mesCobranca, setMesCobranca] = useState(new Date().toISOString().slice(0, 7))
  const [gerandoCobranca, setGerandoCobranca] = useState(false)
  const [dialogAddTurma, setDialogAddTurma] = useState(false)
  const [dialogAddServico, setDialogAddServico] = useState(false)
  const [addTurmaId, setAddTurmaId] = useState("")
  const [addTurmaValor, setAddTurmaValor] = useState("")
  const [addServicoId, setAddServicoId] = useState("")
  const [addServicoValor, setAddServicoValor] = useState("")
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => { loadAluno() }, [params.id])

  async function loadAluno() {
    setLoading(true)
    const [
      { data: alunoData },
      { data: atData },
      { data: asData },
      { data: pagData },
      { data: turmasData },
      { data: servicosData },
    ] = await Promise.all([
      supabase.from("alunos").select("*").eq("id", params.id).single(),
      supabase.from("aluno_turmas").select("*, turma:turmas(*)").eq("aluno_id", params.id).eq("ativo", true),
      supabase.from("aluno_servicos").select("*, servico:servicos(*)").eq("aluno_id", params.id).eq("ativo", true),
      supabase.from("pagamentos").select("*").eq("aluno_id", params.id).order("mes_referencia", { ascending: false }),
      supabase.from("turmas").select("*").order("nome"),
      supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
    ])
    if (!alunoData) { setLoading(false); return }
    setAluno(alunoData as Aluno)
    setAlunoTurmas((atData ?? []) as AlunoTurma[])
    setAlunoServicos((asData ?? []) as AlunoServico[])
    setPagamentos((pagData ?? []) as Pagamento[])
    setTurmasDisp(turmasData ?? [])
    setServicosDisp(servicosData ?? [])
    setForm({ nome: alunoData.nome, whatsapp: alunoData.whatsapp, email: alunoData.email ?? "", dia_vencimento: String(alunoData.dia_vencimento) })
    setLoading(false)
  }

  const valorTotal = alunoTurmas.reduce((a, t) => a + t.valor, 0) + alunoServicos.reduce((a, s) => a + s.valor, 0)
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  async function salvarEdicao() {
    setSalvando(true)
    const { error } = await supabase.from("alunos").update({
      nome: form.nome.trim(),
      whatsapp: form.whatsapp.replace(/\D/g, ""),
      email: form.email.trim() || null,
      dia_vencimento: parseInt(form.dia_vencimento),
    }).eq("id", params.id)
    if (error) toast.error("Erro ao salvar")
    else { toast.success("Atualizado!"); setEditando(false); loadAluno() }
    setSalvando(false)
  }

  async function removerTurma(id: string) {
    await supabase.from("aluno_turmas").update({ ativo: false }).eq("id", id)
    toast.success("Turma removida"); loadAluno()
  }

  async function removerServico(id: string) {
    await supabase.from("aluno_servicos").update({ ativo: false }).eq("id", id)
    toast.success("Servico removido"); loadAluno()
  }

  async function adicionarTurma() {
    if (!addTurmaId) { toast.error("Selecione uma turma"); return }
    setAdicionando(true)
    const { error } = await supabase.from("aluno_turmas").upsert(
      { aluno_id: params.id, turma_id: addTurmaId, valor: parseFloat(addTurmaValor) || 0, ativo: true },
      { onConflict: "aluno_id,turma_id" }
    )
    if (error) toast.error("Erro ao adicionar")
    else { toast.success("Turma adicionada!"); setDialogAddTurma(false); loadAluno() }
    setAdicionando(false)
  }

  async function adicionarServico() {
    if (!addServicoId) { toast.error("Selecione um servico"); return }
    setAdicionando(true)
    const { error } = await supabase.from("aluno_servicos").upsert(
      { aluno_id: params.id, servico_id: addServicoId, valor: parseFloat(addServicoValor) || 0, ativo: true },
      { onConflict: "aluno_id,servico_id" }
    )
    if (error) toast.error("Erro ao adicionar")
    else { toast.success("Servico adicionado!"); setDialogAddServico(false); loadAluno() }
    setAdicionando(false)
  }

  async function marcarInativo() {
    await supabase.from("alunos").update({ status: "inativo" as AlunoStatus }).eq("id", params.id)
    toast.success("Aluno inativado"); setConfirmarInativo(false); loadAluno()
  }

  async function enviarLembrete() {
    const res = await fetch("/api/n8n/enviar-lembrete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno_id: params.id, tipo: "lembrete_manual" }),
    })
    if (res.ok) toast.success("Lembrete enviado!"); else toast.error("Erro ao enviar")
  }

  async function gerarCobranca() {
    setGerandoCobranca(true)
    const res = await fetch("/api/asaas/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno_id: params.id, mes_referencia: mesCobranca, valor: valorTotal }),
    })
    if (res.ok) { toast.success("Cobranca gerada!"); setDialogCobranca(false); loadAluno() }
    else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.detail ? `Asaas: ${data.detail}` : "Erro ao gerar cobranca")
    }
    setGerandoCobranca(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!aluno) return <div className="p-8 text-center text-red-500">Aluno não encontrado. ID: {params.id}</div>

  const turmaIdsAtivos = alunoTurmas.map((t) => t.turma_id)
  const servicoIdsAtivos = alunoServicos.map((s) => s.servico_id)
  const turmasParaAdicionar = turmasDisp.filter((t) => !turmaIdsAtivos.includes(t.id))
  const servicosParaAdicionar = servicosDisp.filter((s) => !servicoIdsAtivos.includes(s.id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/alunos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{aluno.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{fmt(valorTotal)}/mes</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={enviarLembrete}>
            <Send className="h-3.5 w-3.5" />Lembrete
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogCobranca(true)}>
            <Plus className="h-3.5 w-3.5" />Cobranca
          </Button>
          {aluno.status !== "inativo" && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmarInativo(true)}>
              <UserX className="h-3.5 w-3.5" />Inativar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Informacoes</CardTitle>
              {!editando ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditando(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={salvarEdicao} disabled={salvando}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditando(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {editando ? (
                <>
                  {[["Nome", "nome", "text"], ["WhatsApp", "whatsapp", "text"], ["Email", "email", "email"], ["Dia venc.", "dia_vencimento", "number"]].map(([lbl, key, type]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <Label className="text-xs">{lbl}</Label>
                      <Input type={type} className="h-8 text-sm" value={form[key as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <Row label="WhatsApp" value={aluno.whatsapp} />
                  <Row label="Email" value={aluno.email ?? "nao informado"} />
                  <Row label="Vencimento" value={"Dia " + aluno.dia_vencimento} />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={aluno.status === "ativo" ? "default" : aluno.status === "inadimplente" ? "destructive" : "outline"}>
                      {aluno.status}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Turmas</CardTitle>
              {turmasParaAdicionar.length > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddTurmaId(""); setAddTurmaValor(""); setDialogAddTurma(true) }}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {alunoTurmas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma turma.</p>
              ) : (
                alunoTurmas.map((at) => (
                  <div key={at.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1.5 text-sm">
                    <div>
                      <p className="font-medium">{(at.turma as Turma)?.nome}</p>
                      <p className="text-xs text-muted-foreground">{fmt(at.valor)}/mes</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removerTurma(at.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Servicos</CardTitle>
              {servicosParaAdicionar.length > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddServicoId(""); setAddServicoValor(""); setDialogAddServico(true) }}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {alunoServicos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum servico.</p>
              ) : (
                alunoServicos.map((asItem) => (
                  <div key={asItem.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1.5 text-sm">
                    <div>
                      <p className="font-medium">{(asItem.servico as Servico)?.nome}</p>
                      <p className="text-xs text-muted-foreground">{fmt(asItem.valor)}/mes</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removerServico(asItem.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Historico de Pagamentos</CardTitle></CardHeader>
          <CardContent>
            {pagamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cobranca registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                    <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((p) => {
                    const s = STATUS_PAG[p.status]
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.mes_referencia}</TableCell>
                        <TableCell>{fmt(p.valor)}</TableCell>
                        <TableCell><Badge variant="outline" className={s.className}>{s.label}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {p.data_vencimento ? new Date(p.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "nao definido"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString("pt-BR") : "nao pago"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogAddTurma} onOpenChange={setDialogAddTurma}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Turma</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Turma</Label>
              <Select value={addTurmaId} onValueChange={(v) => { setAddTurmaId(v); const t = turmasDisp.find((x) => x.id === v); if (t) setAddTurmaValor(String(t.valor_mensalidade)) }}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{turmasParaAdicionar.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={addTurmaValor} onChange={(e) => setAddTurmaValor(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAddTurma(false)}>Cancelar</Button>
            <Button onClick={adicionarTurma} disabled={adicionando}>{adicionando ? "..." : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAddServico} onOpenChange={setDialogAddServico}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Servico</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Servico</Label>
              <Select value={addServicoId} onValueChange={(v) => { setAddServicoId(v); const s = servicosDisp.find((x) => x.id === v); if (s) setAddServicoValor(String(s.valor)) }}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{servicosParaAdicionar.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={addServicoValor} onChange={(e) => setAddServicoValor(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAddServico(false)}>Cancelar</Button>
            <Button onClick={adicionarServico} disabled={adicionando}>{adicionando ? "..." : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogCobranca} onOpenChange={setDialogCobranca}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Gerar Cobranca Manual</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Mes de referencia</Label>
              <Input type="month" value={mesCobranca} onChange={(e) => setMesCobranca(e.target.value)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-bold">{fmt(valorTotal)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCobranca(false)}>Cancelar</Button>
            <Button onClick={gerarCobranca} disabled={gerandoCobranca || valorTotal === 0}>
              {gerandoCobranca ? "Gerando..." : "Gerar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarInativo} onOpenChange={setConfirmarInativo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar aluno?</AlertDialogTitle>
            <AlertDialogDescription>{aluno.nome} nao recebera cobrancos automaticas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={marcarInativo}>Inativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
