import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Webhook do Asaas — recebe eventos de pagamento
export async function POST(request: Request) {
  try {
    const token = request.headers.get("asaas-access-token")
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event, payment } = body

    if (!event || !payment) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      const chargeId: string = payment.id

      // Buscar pagamento pelo charge_id
      const { data: pagamento } = await supabase
        .from("pagamentos")
        .select("*, aluno:alunos(id, nome, whatsapp)")
        .eq("asaas_charge_id", chargeId)
        .single()

      if (!pagamento) {
        console.warn("Pagamento não encontrado para charge_id:", chargeId)
        return NextResponse.json({ ok: true }) // Não retorna erro para o Asaas
      }

      // Atualizar status do pagamento
      await supabase
        .from("pagamentos")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", pagamento.id)

      // Atualizar status do aluno para ativo
      await supabase
        .from("alunos")
        .update({ status: "ativo" })
        .eq("id", pagamento.aluno_id)

      // Disparar lembrete de confirmação via N8N
      const n8nUrl = process.env.N8N_WEBHOOK_URL
      if (n8nUrl && pagamento.aluno) {
        try {
          await fetch(`${n8nUrl}/asaas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evento: "pagamento_confirmado",
              aluno_id: pagamento.aluno_id,
              pagamento_id: pagamento.id,
            }),
          })
        } catch {
          // N8N não crítico
        }
      }
    }

    if (event === "PAYMENT_OVERDUE") {
      const chargeId: string = payment.id
      await supabase
        .from("pagamentos")
        .update({ status: "vencido" })
        .eq("asaas_charge_id", chargeId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Erro no webhook Asaas:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
