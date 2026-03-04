// Tipos TypeScript correspondentes ao schema do Supabase

export type AlunoStatus = "ativo" | "inativo" | "inadimplente"

export type PagamentoStatus = "pendente" | "pago" | "vencido"

export type DiasSemana =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo"

export interface Turma {
  id: string
  nome: string
  horario: string | null
  dias_semana: DiasSemana[] | null
  valor_mensalidade: number
  created_at: string
}

export interface Servico {
  id: string
  nome: string
  valor: number
  descricao: string | null
  ativo: boolean
  created_at: string
}

export interface Aluno {
  id: string
  nome: string
  whatsapp: string
  email: string | null
  cpf_cnpj: string | null
  dia_vencimento: number
  status: AlunoStatus
  asaas_customer_id: string | null
  created_at: string
}

// Vínculo aluno ↔ turma
export interface AlunoTurma {
  id: string
  aluno_id: string
  turma_id: string
  valor: number
  dia_vencimento: number | null
  ativo: boolean
  data_inicio: string
  created_at: string
  turma?: Turma | null
  aluno?: Aluno | null
}

// Vínculo aluno ↔ serviço
export interface AlunoServico {
  id: string
  aluno_id: string
  servico_id: string
  valor: number
  dia_vencimento: number | null
  ativo: boolean
  data_inicio: string
  created_at: string
  servico?: Servico | null
  aluno?: Aluno | null
}

export interface Pagamento {
  id: string
  aluno_id: string
  mes_referencia: string
  valor: number
  status: PagamentoStatus
  asaas_charge_id: string | null
  link_pagamento: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  created_at: string
  aluno?: Aluno | null
}

export interface Configuracao {
  id: string
  msg_cobranca: string
  msg_confirmacao: string
  msg_lembrete_1dia: string
  msg_lembrete_3dias: string
  msg_suspensao: string
  dias_antecedencia_cobranca: number
}

export type TurmaForm = Omit<Turma, "id" | "created_at">
export type ServicoForm = Omit<Servico, "id" | "created_at">
export type AlunoForm = Omit<Aluno, "id" | "created_at" | "asaas_customer_id">
export type ConfiguracaoForm = Omit<Configuracao, "id">
