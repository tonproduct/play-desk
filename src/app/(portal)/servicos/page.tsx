"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Servico } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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

interface FormData {
  nome: string
  valor: string
  descricao: string
  ativo: boolean
}

const formInicial: FormData = {
  nome: "",
  valor: "",
  descricao: "",
  ativo: true,
}

export default function ServicosPage() {
  const supabase = createClient()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [form, setForm] = useState<FormData>(formInicial)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    loadServicos()
  }, [])

  async function loadServicos() {
    setLoading(true)
    const { data } = await supabase
      .from("servicos")
      .select("*")
      .order("nome")
    setServicos(data ?? [])
    setLoading(false)
  }

  function abrirCriar() {
    setEditando(null)
    setForm(formInicial)
    setDialogOpen(true)
  }

  function abrirEditar(s: Servico) {
    setEditando(s)
    setForm({
      nome: s.nome,
      valor: String(s.valor),
      descricao: s.descricao ?? "",
      ativo: s.ativo,
    })
    setDialogOpen(true)
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do serviço")
      return
    }
    const valor = parseFloat(form.valor)
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    setSalvando(true)
    const dados = {
      nome: form.nome.trim(),
      valor,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    }

    const { error } = editando
      ? await supabase.from("servicos").update(dados).eq("id", editando.id)
      : await supabase.from("servicos").insert(dados)

    if (error) {
      toast.error("Erro ao salvar serviço")
    } else {
      toast.success(editando ? "Serviço atualizado!" : "Serviço criado!")
      setDialogOpen(false)
      loadServicos()
    }
    setSalvando(false)
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("servicos").delete().eq("id", id)
    if (error) {
      toast.error("Não é possível excluir serviço vinculado a alunos")
    } else {
      toast.success("Serviço excluído")
      loadServicos()
    }
    setDeleteId(null)
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Personal, assessoria, aulas avulsas — tudo que você cobra individualmente
          </p>
        </div>
        <Button onClick={abrirCriar} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
          <Button onClick={abrirCriar} variant="link" className="mt-2">
            Criar primeiro serviço
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((s) => (
            <Card key={s.id} className={s.ativo ? undefined : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{s.nome}</CardTitle>
                    {!s.ativo && (
                      <Badge variant="outline" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => abrirEditar(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-base font-semibold text-foreground">
                  {fmt(s.valor)}<span className="text-sm font-normal text-muted-foreground"> / mês</span>
                </CardDescription>
              </CardHeader>
              {s.descricao && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {s.descricao}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Personal, Assessoria Online"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Valor padrão (R$) *</Label>
              <Input
                type="number"
                placeholder="350,00"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Pode ser diferente por aluno na hora de vincular
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes do serviço..."
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
              <Label>Serviço ativo</Label>
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

      {/* Confirmação exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Serviços vinculados a alunos ativos não podem ser excluídos.
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
