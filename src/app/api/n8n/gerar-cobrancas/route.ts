import { NextResponse } from "next/server"

// Dispara o workflow do N8N para gerar cobranças do mês
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const n8nUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL não configurado" },
        { status: 503 }
      )
    }

    const res = await fetch(`${n8nUrl}/gerar-cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        iniciado_em: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Erro N8N gerar-cobrancas:", text)
      return NextResponse.json(
        { error: "Erro ao disparar workflow no N8N" },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, message: "Workflow disparado com sucesso" })
  } catch (err) {
    console.error("Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
