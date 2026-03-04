"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Turma, DiasSemana } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

const DIAS: { value: DiasSemana; label: string }[] = [
  { value: "segunda", label: "Seg" },
  { value: "terca", label: "Ter" },
  { value: "quarta", label: "Qua" },
  { value: "quinta", label: "Qui" },
  { value: "sexta", label: "Sex" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
]

interface TurmaComAlunos extends Turma {
  totalAlunos: number
}

interface FormData {
  nome: string
  horario: string
  dias_semana: DiasSemana[]
  valor_mensalidade: string
}

const formInicial: FormData = {
  nome: "",
  horario: "",
  dias_semana: [],
  valor_mensalidade: "",
}

export default function TurmasPage() {
  const supabase = createClient()
  const [turmas, setTurmas] = useState<TurmaComAlunos[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editando, setEditando] = useState<Turma | null>(null)
  const [form, setForm] = useState<FormData>(formInicial)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    loadTurmas()
  }, [])

  async function loadTurmas() {
    setLoading(true)
    const { data: turmasData } = await supabase.from("turmas").select("*").order("nome")
    const { data: vinculosData } = await supabase
      .from("aluno_turmas")
      .select("turma_id")
      .eq("ativo", true)

    const contagemPorTurma: Record<string, number> = {}
    vinculosData?.forEach((v) => {
      contagemPorTurma[v.turma_id] = (contagemPorTurma[v.turma_id] ?? 0) + 1
    })

    setTurmas(
      (turmasData ?? []).map((t) => ({
        ...t,
        totalAlunos: contagemPorTurma[t.id] ?? 0,
      }))
    )
    setLoading(false)
  }

  function abrirCriar() {
    setEditando(null)
    setForm(formInicial)
    setDialogOpen(true)
  }

  function abrirEditar(turma: Turma) {
    setEditando(turma)
    setForm({
      nome: turma.nome,
      horario: turma.horario ?? "",
      dias_semana: turma.dias_semana ?? [],
      valor_mensalidade: String(turma.valor_mensalidade),
    })
    setDialogOpen(true)
  }

  function toggleDia(dia: DiasSemana) {
    setForm((f) => ({
      ...f,
      dias_semana: f.dias_semana.includes(dia)
        ? f.dias_semana.filter((d) => d !== dia)
        : [...f.dias_semana, dia],
    }))
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da turma")
      return
    }
    const valor = parseFloat(form.valor_mensalidade)
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor de mensalidade válido")
      return
    }

    setSalvando(true)
    const dados = {
      nome: form.nome.trim(),
      horario: form.horario || null,
      dias_semana: form.dias_semana,
      valor_mensalidade: valor,
    }

    const { error } = editando
      ? await supabase.from("turmas").update(dados).eq("id", editando.id)
      : await supabase.from("turmas").insert(dados)

    if (error) {
      toast.error("Erro ao salvar turma")
    } else {
      toast.success(editando ? "Turma atualizada!" : "Turma criada!")
      setDialogOpen(false)
      loadTurmas()
    }
    setSalvando(false)
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("turmas").delete().eq("id", id)
    if (error) {
      toast.error("Não é possível excluir turma com alunos vinculados")
    } else {
      toast.success("Turma excluída")
      loadTurmas()
    }
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Turmas</h1>
        <Button onClick={abrirCriar} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : turmas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Nenhuma turma cadastrada.</p>
          <Button onClick={abrirCriar} variant="link" className="mt-2">
            Criar primeira turma
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <Card key={turma.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{turma.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => abrirEditar(turma)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(turma.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {turma.valor_mensalidade.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  / mês
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {turma.horario && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {turma.horario}
                  </div>
                )}
                {turma.dias_semana && turma.dias_semana.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {turma.dias_semana.map((d) => (
                      <span
                        key={d}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium capitalize"
                      >
                        {DIAS.find((dia) => dia.value === d)?.label ?? d}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {turma.totalAlunos} aluno{turma.totalAlunos !== 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Turma" : "Nova Turma"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nome da turma *</Label>
              <Input
                placeholder="Ex: Turma Avançada"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Horário</Label>
              <Input
                placeholder="Ex: 18:00 - 19:30"
                value={form.horario}
                onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((dia) => (
                  <div key={dia.value} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`dia-${dia.value}`}
                      checked={form.dias_semana.includes(dia.value)}
                      onCheckedChange={() => toggleDia(dia.value)}
                    />
                    <Label htmlFor={`dia-${dia.value}`} className="cursor-pointer font-normal">
                      {dia.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Valor da mensalidade (R$) *</Label>
              <Input
                type="number"
                placeholder="200,00"
                min="0"
                step="0.01"
                value={form.valor_mensalidade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor_mensalidade: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir turma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Turmas com alunos vinculados não podem
              ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && excluir(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
