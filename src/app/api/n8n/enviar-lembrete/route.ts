import { NextResponse } from "next/server"

// Dispara envio de lembrete via N8N para um aluno específico
export async function POST(request: Request) {
  try {
    const { aluno_id, tipo } = await request.json()

    if (!aluno_id || !tipo) {
      return NextResponse.json(
        { error: "aluno_id e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL não configurado" },
        { status: 503 }
      )
    }

    const res = await fetch(`${n8nUrl}/enviar-lembrete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno_id, tipo }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Erro N8N enviar-lembrete:", text)
      return NextResponse.json(
        { error: "Erro ao enviar lembrete via N8N" },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
