import type {
  Lote,
  RegistoMortalidade,
  RegistoRacao,
  RegistoPesagem,
  RegistoAgua,
  RegistoDespesa,
  RegistoVenda,
  ResumoLote,
} from '../types';

// ---------- Datas ----------

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatarData(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function diasEntre(inicio: string, fim: string): number {
  const i = new Date(inicio.slice(0, 10));
  const f = new Date(fim.slice(0, 10));
  return Math.floor((f.getTime() - i.getTime()) / 86400000);
}

/**
 * Idade do lote em dias.
 * Para lotes encerrados, usa a data de encerramento em vez de hoje.
 */
export function idadeDias(dataChegada: string, dataEncerramento?: string | null): number {
  const fim = dataEncerramento || hojeISO();
  return Math.max(0, diasEntre(dataChegada, fim));
}

export function idadeSemanas(dataChegada: string, dataEncerramento?: string | null): number {
  return Math.floor(idadeDias(dataChegada, dataEncerramento) / 7);
}

// ---------- Moeda ----------

export function formatarMZN(valor: number | null | undefined): string {
  if (valor == null || isNaN(valor)) return '—';
  return (
    valor.toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' MT'
  );
}

export function formatarNumero(
  valor: number | null | undefined,
  casas = 2
): string {
  if (valor == null || isNaN(valor)) return '—';
  return valor.toLocaleString('pt-MZ', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarPercentagem(
  valor: number | null | undefined
): string {
  if (valor == null || isNaN(valor)) return '—';
  return valor.toFixed(1) + '%';
}

// ---------- Validações ----------

export function validarNaoNegativo(valor: number): string | null {
  if (isNaN(valor)) return 'Valor inválido';
  if (valor < 0) return 'Não pode ser negativo';
  return null;
}

export function validarPositivo(valor: number): string | null {
  if (isNaN(valor)) return 'Valor inválido';
  if (valor <= 0) return 'Tem de ser maior que zero';
  return null;
}

export function validarData(iso: string): string | null {
  if (!iso) return 'Data obrigatória';
  const d = new Date(iso.slice(0, 10));
  if (isNaN(d.getTime())) return 'Data inválida';
  return null;
}

/**
 * Verifica se a data é anterior à chegada do lote (inválida para registos).
 */
export function dataAnteriorChegada(dataRegisto: string, dataChegada: string): boolean {
  return dataRegisto.slice(0, 10) < dataChegada.slice(0, 10);
}

/**
 * Valida que a data do registo não é anterior à chegada do lote nem futura.
 */
export function validarDataRegisto(dataRegisto: string, dataChegada: string): string | null {
  const errData = validarData(dataRegisto);
  if (errData) return errData;
  if (dataAnteriorChegada(dataRegisto, dataChegada)) {
    return 'A data não pode ser anterior à chegada do lote.';
  }
  if (dataRegisto.slice(0, 10) > hojeISO()) {
    return 'A data não pode ser no futuro.';
  }
  return null;
}

// ---------- Cálculos por lote ----------

export function calcularResumoLote(
  lote: Lote,
  mortalidade: RegistoMortalidade[],
  racao: RegistoRacao[],
  pesagens: RegistoPesagem[],
  despesas: RegistoDespesa[],
  vendas: RegistoVenda[]
): ResumoLote {
  const mortLote = mortalidade.filter((m) => m.loteId === lote.id);
  const racLote = racao.filter((r) => r.loteId === lote.id);
  const pesLote = pesagens.filter((p) => p.loteId === lote.id);
  const despLote = despesas.filter((d) => d.loteId === lote.id);
  const vendLote = vendas.filter((v) => v.loteId === lote.id);

  // --- Perdas ---
  const totalMortos = mortLote.reduce((s, m) => s + (m.mortos || 0), 0);
  const totalDescartados = mortLote.reduce(
    (s, m) => s + (m.descartados || 0),
    0
  );
  const totalPerdas = totalMortos + totalDescartados;

  // --- Vendas ---
  const totalAvesVendidas = vendLote.reduce((s, v) => s + v.numeroAves, 0);
  const pesoTotalVendido = vendLote.reduce((s, v) => s + v.pesoTotal, 0);

  // --- Frangos vivos ---
  // vivos = inicial - perdas - vendidas (não pode ser negativo)
  const vivos = Math.max(0, lote.quantidadeInicial - totalPerdas - totalAvesVendidas);
  // Aves vivas que ainda não foram vendidas (disponíveis para venda)
  const vivosNaoVendidos = Math.max(0, lote.quantidadeInicial - totalPerdas - totalAvesVendidas);

  // --- Taxas ---
  const taxaMortalidade =
    lote.quantidadeInicial > 0
      ? (totalPerdas / lote.quantidadeInicial) * 100
      : 0;
  const taxaSobrevivencia =
    lote.quantidadeInicial > 0 ? 100 - taxaMortalidade : 0;

  // --- Ração ---
  const racaoCompradaTotal = racLote.reduce(
    (s, r) => s + (r.quantidadeComprada || 0),
    0
  );
  const racaoConsumidaTotal = racLote.reduce(
    (s, r) => s + (r.quantidadeConsumida || 0),
    0
  );
  // Stock = comprada - consumida (nunca negativo)
  const stockRacao = Math.max(0, racaoCompradaTotal - racaoConsumidaTotal);

  // Custo da ração comprada (todas as compras)
  const custoRacaoComprada = racLote.reduce(
    (s, r) => s + (r.quantidadeComprada || 0) * (r.precoPorKg || 0),
    0
  );
  // Custo da ração efetivamente consumida (proporção do custo total)
  const custoRacaoConsumida =
    racaoCompradaTotal > 0
      ? (racaoConsumidaTotal / racaoCompradaTotal) * custoRacaoComprada
      : 0;

  // --- Pesagens ---
  const pesagensOrdenadas = [...pesLote].sort((a, b) =>
    a.data.localeCompare(b.data)
  );
  const ultimaPesagem = pesagensOrdenadas[pesagensOrdenadas.length - 1];
  const primeiraPesagem = pesagensOrdenadas[0];

  const pesoMedioAtual =
    ultimaPesagem && ultimaPesagem.numeroAvesPesadas > 0
      ? ultimaPesagem.pesoTotal / ultimaPesagem.numeroAvesPesadas
      : null;

  // --- Ganho médio diário (entre primeira e última pesagem) ---
  // GMD = [(peso médio final kg - peso médio inicial kg) × 1000] / dias entre pesagens
  let ganhoMedioDiario: number | null = null;
  if (pesagensOrdenadas.length >= 2 && ultimaPesagem && primeiraPesagem) {
    const pesoInicial =
      primeiraPesagem.numeroAvesPesadas > 0
        ? primeiraPesagem.pesoTotal / primeiraPesagem.numeroAvesPesadas
        : null;
    const pesoFinal = pesoMedioAtual;
    if (pesoInicial != null && pesoFinal != null) {
      const dias = diasEntre(primeiraPesagem.data, ultimaPesagem.data);
      if (dias > 0) {
        ganhoMedioDiario = ((pesoFinal - pesoInicial) * 1000) / dias; // g/ave/dia
      }
    }
  }

  // --- Consumo de ração por ave ---
  // Usa vivosNaoVendidos como base (aves ainda no galpão)
  const consumoRacaoPorAve =
    vivosNaoVendidos > 0 && racaoConsumidaTotal > 0
      ? racaoConsumidaTotal / vivosNaoVendidos
      : null;

  // --- Conversão alimentar aparente ---
  // CA = ração consumida / ganho de biomassa
  // Ganho de biomassa = peso vendido + peso vivo estimado (peso médio × vivos não vendidos)
  // Só calcula se houver dados de peso
  const pesoVivoEstimado =
    pesoMedioAtual != null ? pesoMedioAtual * vivosNaoVendidos : 0;
  const ganhoBiomassa = pesoTotalVendido + pesoVivoEstimado;
  const conversaoAlimentar =
    racaoConsumidaTotal > 0 && ganhoBiomassa > 0
      ? racaoConsumidaTotal / ganhoBiomassa
      : null;

  // --- Idade ---
  const dias = idadeDias(lote.dataChegada, lote.dataEncerramento);

  // --- Despesas e Receitas ---
  // Custo total de produção = aquisição + custo ração comprada + despesas registadas
  const totalDespesas =
    lote.custoAquisicao +
    custoRacaoComprada +
    despLote.reduce((s, d) => s + d.valor, 0);

  const totalReceitas = vendLote.reduce((s, v) => s + v.valorTotal, 0);

  // Lucro = receitas - despesas totais
  const lucro = totalReceitas - totalDespesas;
  const margem =
    totalReceitas > 0 ? (lucro / totalReceitas) * 100 : null;

  // Custo por ave vendida
  const custoPorAveVendida =
    totalAvesVendidas > 0 ? totalDespesas / totalAvesVendidas : null;

  // Custo por kg produzido
  const custoPorKg =
    pesoTotalVendido > 0 ? totalDespesas / pesoTotalVendido : null;

  // --- Fluxo de caixa ---
  // Despesas de caixa = despesas registadas + custo ração comprada (não inclui custoAquisicao que é separado)
  const despesasCaixa =
    custoRacaoComprada + despLote.reduce((s, d) => s + d.valor, 0);
  // Fluxo de caixa simplificado = receitas - despesas de caixa - aquisição
  const fluxoCaixa = totalReceitas - despesasCaixa - lote.custoAquisicao;

  // --- Índice de eficiência produtiva ---
  // IEA = (peso médio × % sobrevivência × 100) / (CA × idade em dias)
  const indiceEficiencia =
    pesoMedioAtual != null &&
    conversaoAlimentar != null &&
    conversaoAlimentar > 0 &&
    dias > 0 &&
    lote.quantidadeInicial > 0
      ? (pesoMedioAtual * (taxaSobrevivencia / 100) * 100) /
        (conversaoAlimentar * dias)
      : null;

  return {
    lote,
    idadeDias: dias,
    idadeSemanas: Math.floor(dias / 7),
    vivos,
    vivosNaoVendidos,
    totalMortos,
    totalDescartados,
    totalPerdas,
    taxaMortalidade,
    taxaSobrevivencia,
    racaoCompradaTotal,
    racaoConsumidaTotal,
    stockRacao,
    custoRacaoComprada,
    custoRacaoConsumida,
    pesoMedioAtual,
    consumoRacaoPorAve,
    conversaoAlimentar,
    ganhoMedioDiario,
    totalDespesas,
    totalReceitas,
    lucro,
    margem,
    custoPorAveVendida,
    custoPorKg,
    indiceEficiencia,
    totalAvesVendidas,
    pesoTotalVendido,
    fluxoCaixa,
    despesasCaixa,
  };
}

// ---------- Consumo de água ----------

export function calcularResumoAgua(
  loteId: string,
  registosAgua: RegistoAgua[],
  vivos: number
): {
  totalLitros: number;
  mediaDiaria: number;
  porAve: number | null;
  ultimoConsumo: number | null;
  variacao: number | null;
} {
  const registos = registosAgua
    .filter((a) => a.loteId === loteId)
    .sort((a, b) => a.data.localeCompare(b.data));
  const totalLitros = registos.reduce((s, a) => s + a.quantidade, 0);

  // Média diária baseada no intervalo real de dias entre o primeiro e último registo
  let mediaDiaria = 0;
  if (registos.length === 1) {
    mediaDiaria = registos[0].quantidade;
  } else if (registos.length > 1) {
    const dias = Math.max(1, diasEntre(registos[0].data, registos[registos.length - 1].data) + 1);
    mediaDiaria = totalLitros / dias;
  }

  // Consumo por ave em mL (mililitros), não litros
  const porAve = vivos > 0 && mediaDiaria > 0 ? (mediaDiaria / vivos) * 1000 : null;
  const ultimo = registos[registos.length - 1];
  const penultimo = registos[registos.length - 2];
  const variacao =
    ultimo && penultimo && penultimo.quantidade > 0
      ? ((ultimo.quantidade - penultimo.quantidade) / penultimo.quantidade) *
        100
      : null;
  return {
    totalLitros,
    mediaDiaria,
    porAve,
    ultimoConsumo: ultimo ? ultimo.quantidade : null,
    variacao,
  };
}

// ---------- Helpers ----------

export function sortPorData<T extends { data: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => b.data.localeCompare(a.data));
}

export function sortPorCreatedAt<T extends { createdAt: string }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
}
