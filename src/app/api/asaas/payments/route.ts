import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ASAAS_BASE_URL =
  process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3"

export async function POST(request: Request) {
  try {
    const { aluno_id, mes_referencia, valor } = await request.json()

    if (!aluno_id || !mes_referencia || !valor) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar aluno com asaas_customer_id
    const { data: aluno, error: alunoError } = await supabase
      .from("alunos")
      .select("*")
      .eq("id", aluno_id)
      .single()

    if (alunoError || !aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    if (!aluno.asaas_customer_id) {
      return NextResponse.json(
        { error: "Aluno não tem cadastro no Asaas" },
        { status: 400 }
      )
    }

    // Calcular data de vencimento
    const [ano, mes] = mes_referencia.split("-").map(Number)
    const dataVencimento = new Date(ano, mes - 1, aluno.dia_vencimento)
    const dueDate = dataVencimento.toISOString().split("T")[0]

    // Criar cobrança Pix no Asaas
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: process.env.ASAAS_API_KEY!,
      },
      body: JSON.stringify({
        customer: aluno.asaas_customer_id,
        billingType: "PIX",
        value: valor,
        dueDate,
        description: `Mensalidade ${mes_referencia}`,
      }),
    })

    if (!asaasRes.ok) {
      const errorBody = await asaasRes.text()
      console.error("Erro Asaas payments:", errorBody)
      return NextResponse.json(
        { error: "Erro ao criar cobrança no Asaas", detail: errorBody },
        { status: 502 }
      )
    }

    const asaasPayment = await asaasRes.json()
    const chargeId: string = asaasPayment.id

    // Buscar QR Code / link Pix
    let linkPagamento: string | null = null
    try {
      const qrRes = await fetch(
        `${ASAAS_BASE_URL}/payments/${chargeId}/pixQrCode`,
        {
          headers: { access_token: process.env.ASAAS_API_KEY! },
        }
      )
      if (qrRes.ok) {
        const qrData = await qrRes.json()
        linkPagamento = qrData.payload ?? qrData.encodedImage ?? null
      }
    } catch {
      // QR Code não crítico
    }

    // Salvar pagamento no banco
    const { error: pagError } = await supabase.from("pagamentos").insert({
      aluno_id,
      mes_referencia,
      valor,
      status: "pendente",
      asaas_charge_id: chargeId,
      link_pagamento: linkPagamento,
      data_vencimento: dueDate,
    })

    if (pagError) {
      console.error("Erro ao salvar pagamento:", pagError)
      return NextResponse.json(
        { error: "Cobrança criada no Asaas mas erro ao salvar no banco" },
        { status: 500 }
      )
    }

    return NextResponse.json({ charge_id: chargeId, link_pagamento: linkPagamento })
  } catch (err) {
    console.error("Erro inesperado:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
