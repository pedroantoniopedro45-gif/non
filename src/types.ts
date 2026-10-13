// Tipos centrais do AVICONTROL PRO — Frangos de Corte

export type Linhagem = 'Ross' | 'Cobb' | 'Hubbard' | 'Cobb-Vantress' | 'Outra';

export type TipoRacao =
  | 'pre-inicial'
  | 'inicial'
  | 'crescimento'
  | 'acabamento';

export type CategoriaDespesa =
  | 'pintos'
  | 'racao'
  | 'vacinas'
  | 'medicamentos'
  | 'vitaminas'
  | 'cama'
  | 'energia'
  | 'agua'
  | 'mao-obra'
  | 'transporte'
  | 'aquecimento'
  | 'equipamentos'
  | 'outras';

export type TipoSaude = 'vacinacao' | 'medicamento' | 'vitamina' | 'suplemento';

export type EstadoLote = 'ativo' | 'vendido' | 'encerrado';

// ---------- Lote ----------
export interface Lote {
  id: string;
  nome: string;
  dataChegada: string; // ISO date
  quantidadeInicial: number;
  linhagem: Linhagem;
  fornecedor: string;
  precoPorPinto: number;
  custoAquisicao: number;
  origem: string;
  observacoes: string;
  estado: EstadoLote;
  dataEncerramento: string | null; // ISO date or null if active
  createdAt: string;
  updatedAt: string;
}

// ---------- Mortalidade ----------
export interface RegistoMortalidade {
  id: string;
  loteId: string;
  data: string;
  mortos: number;
  descartados: number;
  causa: string;
  observacoes: string;
  createdAt: string;
}

// ---------- Ração ----------
export interface RegistoRacao {
  id: string;
  loteId: string;
  data: string;
  marca: string;
  tipo: TipoRacao;
  quantidadeComprada: number; // kg
  quantidadeConsumida: number; // kg
  precoPorKg: number;
  createdAt: string;
}

// ---------- Pesagem ----------
export interface RegistoPesagem {
  id: string;
  loteId: string;
  data: string;
  numeroAvesPesadas: number;
  pesoTotal: number; // kg
  createdAt: string;
}

// ---------- Água ----------
export interface RegistoAgua {
  id: string;
  loteId: string;
  data: string;
  quantidade: number; // litros
  observacoes: string;
  createdAt: string;
}

// ---------- Saúde ----------
export interface RegistoSaude {
  id: string;
  loteId: string;
  tipo: TipoSaude;
  data: string;
  produto: string;
  quantidade: string;
  responsavel: string;
  observacoes: string;
  createdAt: string;
}

export interface Lembrete {
  id: string;
  loteId: string | null;
  titulo: string;
  data: string;
  feito: boolean;
  createdAt: string;
}

// ---------- Despesas ----------
export interface RegistoDespesa {
  id: string;
  loteId: string;
  data: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  createdAt: string;
}

// ---------- Vendas ----------
export interface RegistoVenda {
  id: string;
  loteId: string;
  data: string;
  numeroAves: number;
  pesoTotal: number; // kg
  precoPorKg: number | null;
  precoPorAve: number | null;
  valorTotal: number;
  comprador: string;
  observacoes: string;
  createdAt: string;
}

// ---------- Metas de crescimento ----------
export interface MetaCrescimento {
  id: string;
  linhagem: Linhagem;
  semana: number;
  pesoMeta: number; // kg
}

export type LicensePlan = 'monthly' | 'yearly' | 'lifetime';
export type LicenseRequestStatus = 'pending_verification' | 'approved' | 'rejected';

export interface LicensePurchaseRequest {
  id: string;
  customerName: string;
  licenseType: LicensePlan;
  amountMzn: number;
  paymentMethod: 'e-mola';
  paymentNumber: '865831887';
  transferHolderName: string;
  transactionReference: string;
  receiptName: string;
  receiptDataUrl: string | null;
  status: LicenseRequestStatus;
  createdAt: string;
  syncStatus: 'pending' | 'synced';
}

// ---------- Nomes de tabelas IndexedDB ----------
export type StoreName =
  | 'lotes'
  | 'mortalidade'
  | 'racao'
  | 'pesagens'
  | 'agua'
  | 'saude'
  | 'lembretes'
  | 'despesas'
  | 'vendas'
  | 'metas'
  | 'pedidosLicenca';

// ---------- Tipos calculados ----------
export interface ResumoLote {
  lote: Lote;
  idadeDias: number;
  idadeSemanas: number;
  vivos: number; // inicial - perdas - vendidas
  vivosNaoVendidos: number; // frangos vivos que ainda não foram vendidos
  totalMortos: number;
  totalDescartados: number;
  totalPerdas: number;
  taxaMortalidade: number;
  taxaSobrevivencia: number;
  racaoCompradaTotal: number;
  racaoConsumidaTotal: number;
  stockRacao: number;
  custoRacaoComprada: number;
  custoRacaoConsumida: number;
  pesoMedioAtual: number | null;
  consumoRacaoPorAve: number | null;
  conversaoAlimentar: number | null;
  ganhoMedioDiario: number | null; // g/ave/dia entre duas pesagens
  totalDespesas: number;
  totalReceitas: number;
  lucro: number | null;
  margem: number | null;
  custoPorAveVendida: number | null;
  custoPorKg: number | null;
  indiceEficiencia: number | null;
  totalAvesVendidas: number;
  pesoTotalVendido: number;
  fluxoCaixa: number | null; // receitas - despesas de caixa (sem custo de aquisição)
  despesasCaixa: number; // despesas registadas + custo ração comprada (não inclui custoAquisicao)
}
