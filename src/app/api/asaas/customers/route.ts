import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ASAAS_BASE_URL =
  process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3"

export async function POST(request: Request) {
  try {
    const { aluno_id, nome, whatsapp, email, cpf_cnpj } = await request.json()

    if (!aluno_id || !nome || !whatsapp) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    // Formatar WhatsApp (somente dígitos)
    const mobilePhone = whatsapp.replace(/\D/g, "")
    const cpfCnpjClean = cpf_cnpj ? cpf_cnpj.replace(/\D/g, "") : null

    // Criar cliente no Asaas
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: process.env.ASAAS_API_KEY!,
      },
      body: JSON.stringify({
        name: nome,
        mobilePhone,
        ...(email ? { email } : {}),
        ...(cpfCnpjClean ? { cpfCnpj: cpfCnpjClean } : {}),
      }),
    })

    if (!asaasRes.ok) {
      const errorBody = await asaasRes.text()
      console.error("Erro Asaas:", errorBody)
      return NextResponse.json(
        { error: "Erro ao criar cliente no Asaas" },
        { status: 502 }
      )
    }

    const asaasData = await asaasRes.json()
    const asaasCustomerId: string = asaasData.id

    // Salvar ID do Asaas no aluno
    const supabase = await createClient()
    const { error } = await supabase
      .from("alunos")
      .update({ asaas_customer_id: asaasCustomerId })
      .eq("id", aluno_id)

    if (error) {
      console.error("Erro ao salvar asaas_customer_id:", error)
      return NextResponse.json(
        { error: "Cliente criado no Asaas mas erro ao salvar no banco" },
        { status: 500 }
      )
    }

    return NextResponse.json({ asaas_customer_id: asaasCustomerId })
  } catch (err) {
    console.error("Erro inesperado:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
