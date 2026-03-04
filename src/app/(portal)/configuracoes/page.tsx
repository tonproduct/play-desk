"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { ConfiguracaoForm } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const VARIAVEIS = ["{nome}", "{mes}", "{valor}", "{vencimento}", "{link}"]

const MSG_FIELDS: {
  key: keyof ConfiguracaoForm
  label: string
  description: string
}[] = [
  {
    key: "msg_cobranca",
    label: "Mensagem de cobrança",
    description: "Enviada quando a cobrança é gerada",
  },
  {
    key: "msg_confirmacao",
    label: "Confirmação de pagamento",
    description: "Enviada quando o pagamento é confirmado",
  },
  {
    key: "msg_lembrete_1dia",
    label: "Lembrete 1 dia de atraso",
    description: "Enviada no dia seguinte ao vencimento",
  },
  {
    key: "msg_lembrete_3dias",
    label: "Lembrete 3 dias de atraso",
    description: "Enviada 3 dias após o vencimento",
  },
  {
    key: "msg_suspensao",
    label: "Aviso de suspensão",
    description: "Enviada após 7 dias de atraso",
  },
]

const defaultConfig: ConfiguracaoForm = {
  msg_cobranca:
    "Olá {nome}! Sua mensalidade de {mes} no valor de R$ {valor} vence em {vencimento}. Pague via Pix: {link}",
  msg_confirmacao:
    "Pagamento confirmado! ✅ Obrigado {nome}, até a próxima aula!",
  msg_lembrete_1dia:
    "Oi {nome}, sua mensalidade vence amanhã! Pague aqui: {link}",
  msg_lembrete_3dias:
    "Oi {nome}, sua mensalidade está em atraso há 3 dias. Regularize: {link}",
  msg_suspensao:
    "Oi {nome}, seu acesso será suspenso por falta de pagamento. Entre em contato.",
  dias_antecedencia_cobranca: 5,
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<ConfiguracaoForm>(defaultConfig)
  const [configId, setConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [n8nUrl, setN8nUrl] = useState("")
  const [asaasKey, setAsaasKey] = useState("")
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [activeField, setActiveField] = useState<keyof ConfiguracaoForm | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    const { data } = await supabase
      .from("configuracoes")
      .select("*")
      .limit(1)
      .single()

    if (data) {
      setConfigId(data.id)
      setConfig({
        msg_cobranca: data.msg_cobranca,
        msg_confirmacao: data.msg_confirmacao,
        msg_lembrete_1dia: data.msg_lembrete_1dia,
        msg_lembrete_3dias: data.msg_lembrete_3dias,
        msg_suspensao: data.msg_suspensao,
        dias_antecedencia_cobranca: data.dias_antecedencia_cobranca,
      })
    }
    setLoading(false)
  }

  async function salvarConfig() {
    setSalvando(true)
    const { error } = configId
      ? await supabase.from("configuracoes").update(config).eq("id", configId)
      : await supabase.from("configuracoes").insert(config)

    if (error) {
      toast.error("Erro ao salvar configurações")
    } else {
      toast.success("Configurações salvas!")
      loadConfig()
    }
    setSalvando(false)
  }

  function inserirVariavel(variavel: string) {
    if (!activeField) {
      toast.info("Clique em um campo de mensagem primeiro")
      return
    }
    setConfig((c) => ({
      ...c,
      [activeField]: (c[activeField] as string) + variavel,
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="mensagens">
        <TabsList>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="integrações">Integrações</TabsTrigger>
        </TabsList>

        {/* Tab mensagens */}
        <TabsContent value="mensagens" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>
                Configure os textos enviados automaticamente via WhatsApp. Clique
                em uma variável para inserir no campo ativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Chips de variáveis */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Variáveis disponíveis
                </Label>
                <div className="flex flex-wrap gap-2">
                  {VARIAVEIS.map((v) => (
                    <button
                      key={v}
                      onClick={() => inserirVariavel(v)}
                      className="rounded-full border bg-muted px-3 py-1 text-xs font-mono font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Campos de mensagem */}
              {MSG_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label>{field.label}</Label>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                  <Textarea
                    rows={3}
                    value={config[field.key] as string}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, [field.key]: e.target.value }))
                    }
                    onFocus={() => setActiveField(field.key)}
                    ref={(el) => {
                      if (activeField === field.key)
                        activeTextareaRef.current = el
                    }}
                    className="resize-none font-mono text-sm"
                  />
                </div>
              ))}

              <Separator />

              <div className="flex flex-col gap-1.5">
                <Label>Dias de antecedência para cobrar</Label>
                <p className="text-xs text-muted-foreground">
                  Quantos dias antes do vencimento o sistema enviará a cobrança
                </p>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  className="w-24"
                  value={config.dias_antecedencia_cobranca}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      dias_antecedencia_cobranca: parseInt(e.target.value) || 5,
                    }))
                  }
                />
              </div>

              <Button onClick={salvarConfig} disabled={salvando} className="w-fit">
                {salvando ? "Salvando..." : "Salvar configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab integrações */}
        <TabsContent value="integrações" className="mt-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>N8N Webhook</CardTitle>
                <CardDescription>
                  URL base do seu servidor N8N para automações
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>URL do Webhook N8N</Label>
                  <Input
                    placeholder="https://seu-n8n.com/webhook"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL na variável{" "}
                  <code className="rounded bg-muted px-1">N8N_WEBHOOK_URL</code>{" "}
                  no arquivo <code className="rounded bg-muted px-1">.env.local</code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asaas (Sandbox)</CardTitle>
                <CardDescription>
                  Configuração da API de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>API Key do Asaas</Label>
                  <Input
                    type="password"
                    placeholder="$aas_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={asaasKey}
                    onChange={(e) => setAsaasKey(e.target.value)}
                  />
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <p className="text-xs text-yellow-700">
                    🔒 Por segurança, configure a API Key via variável de ambiente{" "}
                    <code className="font-mono">ASAAS_API_KEY</code> no arquivo{" "}
                    <code className="font-mono">.env.local</code>. Nunca exponha
                    a chave no frontend.
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <p>
                    <strong>Sandbox:</strong>{" "}
                    <span className="font-mono">
                      https://sandbox.asaas.com/api/v3
                    </span>
                  </p>
                  <p>
                    <strong>Produção:</strong>{" "}
                    <span className="font-mono">
                      https://api.asaas.com/api/v3
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolution API (WhatsApp)</CardTitle>
                <CardDescription>
                  Configuração do servidor de WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Configure as variáveis abaixo no{" "}
                  <code className="font-mono">.env.local</code>:
                  <pre className="mt-2 font-mono leading-6">
                    {`EVOLUTION_API_URL=https://seu-servidor.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCIA=nome-da-instancia`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
