import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Info, Package } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import { calcularResumoLote, formatarMZN, formatarNumero, formatarPercentagem } from '../utils/calculos';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import EmptyState from '../components/EmptyState';

interface IndicadoresViewProps {
  data: AppData;
}

interface Indicator {
  label: string;
  value: string;
  explanation: string;
  available: boolean;
  good?: boolean;
}

export default function IndicadoresView({ data }: IndicadoresViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);

  const selectedId = loteId || data.lotes[0]?.id || null;
  const lote = data.lotes.find((l) => l.id === selectedId);
  const resumo = useMemo(
    () => (lote ? calcularResumoLote(lote, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas) : null),
    [lote, data]
  );

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Indicadores de Desempenho" subtitle="Análise de eficiência produtiva" icon={<TrendingUp size={22} />} />
        <EmptyState icon={<Package size={48} />} title="Sem lotes" description="Crie um lote e registe dados para ver os indicadores de desempenho." />
      </div>
    );
  }

  const indicadores: Indicator[] = resumo
    ? [
        {
          label: 'Mortalidade Acumulada',
          value: `${formatarNumero(resumo.totalMortos + resumo.totalDescartados, 0)} aves`,
          explanation: 'Total de frangos mortos e descartados desde o início do lote.',
          available: true,
          good: resumo.taxaMortalidade < 5,
        },
        {
          label: 'Taxa de Sobrevivência',
          value: formatarPercentagem(resumo.taxaSobrevivencia),
          explanation: 'Percentagem de frangos que sobreviveram em relação ao número inicial.',
          available: true,
          good: resumo.taxaSobrevivencia >= 95,
        },
        {
          label: 'Peso Médio Atual',
          value: resumo.pesoMedioAtual != null ? `${formatarNumero(resumo.pesoMedioAtual, 3)} kg` : '—',
          explanation: 'Peso médio por frango obtido na última pesagem.',
          available: resumo.pesoMedioAtual != null,
        },
        {
          label: 'Ração Consumida Acumulada',
          value: `${formatarNumero(resumo.racaoConsumidaTotal, 0)} kg`,
          explanation: 'Total de ração efetivamente consumida pelo lote.',
          available: resumo.racaoConsumidaTotal > 0,
        },
        {
          label: 'Consumo Médio de Ração por Ave',
          value: resumo.consumoRacaoPorAve != null ? `${formatarNumero(resumo.consumoRacaoPorAve, 3)} kg` : '—',
          explanation: 'Quantidade de ração consumida por cada frango vivo.',
          available: resumo.consumoRacaoPorAve != null,
        },
        {
          label: 'Conversão Alimentar Aparente',
          value: resumo.conversaoAlimentar != null ? formatarNumero(resumo.conversaoAlimentar, 2) : '—',
          explanation: 'Quantidade de ração necessária para produzir 1 kg de frango. Valores mais baixos indicam melhor eficiência.',
          available: resumo.conversaoAlimentar != null,
          good: resumo.conversaoAlimentar != null && resumo.conversaoAlimentar < 2,
        },
        {
          label: 'Ganho Médio Diário',
          value: resumo.ganhoMedioDiario != null ? `${formatarNumero(resumo.ganhoMedioDiario, 0)} g/dia` : '—',
          explanation: 'Aumento de peso médio por dia entre a primeira e a última pesagem do lote.',
          available: resumo.ganhoMedioDiario != null,
        },
        {
          label: 'Custo Total de Produção',
          value: formatarMZN(resumo.totalDespesas),
          explanation: 'Soma de todas as despesas: aquisição de pintos, ração comprada e despesas registadas.',
          available: resumo.totalDespesas > 0,
        },
        {
          label: 'Custo de Produção por Ave Vendida',
          value: resumo.custoPorAveVendida != null ? formatarMZN(resumo.custoPorAveVendida) : '—',
          explanation: 'Custo total dividido pelo número de aves vendidas.',
          available: resumo.custoPorAveVendida != null,
        },
        {
          label: 'Custo por kg Produzido',
          value: resumo.custoPorKg != null ? formatarMZN(resumo.custoPorKg) : '—',
          explanation: 'Custo total dividido pelo peso total vendido em kg.',
          available: resumo.custoPorKg != null,
        },
        {
          label: 'Receita Total',
          value: formatarMZN(resumo.totalReceitas),
          explanation: 'Soma de todas as vendas registadas para este lote.',
          available: resumo.totalReceitas > 0,
        },
        {
          label: resumo.lucro != null && resumo.lucro >= 0 ? 'Lucro' : 'Prejuízo',
          value: resumo.lucro != null ? formatarMZN(Math.abs(resumo.lucro)) : '—',
          explanation: 'Diferença entre receitas e despesas totais.',
          available: resumo.lucro != null,
          good: resumo.lucro != null && resumo.lucro >= 0,
        },
        {
          label: 'Margem de Lucro',
          value: resumo.margem != null ? formatarPercentagem(resumo.margem) : '—',
          explanation: 'Lucro em percentagem da receita total.',
          available: resumo.margem != null,
          good: resumo.margem != null && resumo.margem >= 0,
        },
        {
          label: 'Fluxo de Caixa',
          value: resumo.fluxoCaixa != null ? formatarMZN(resumo.fluxoCaixa) : '—',
          explanation: 'Receitas menos despesas de caixa (aquisição + ração comprada + despesas registadas). Indica o saldo financeiro do lote.',
          available: resumo.fluxoCaixa != null,
          good: resumo.fluxoCaixa != null && resumo.fluxoCaixa >= 0,
        },
        {
          label: 'Índice de Eficiência Produtiva',
          value: resumo.indiceEficiencia != null ? formatarNumero(resumo.indiceEficiencia, 0) : '—',
          explanation: 'Combina peso médio, sobrevivência, conversão alimentar e idade. Valores mais altos indicam melhor desempenho geral.',
          available: resumo.indiceEficiencia != null,
          good: resumo.indiceEficiencia != null && resumo.indiceEficiencia > 300,
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Indicadores de Desempenho"
        subtitle="Análise de eficiência produtiva"
        icon={<TrendingUp size={22} />}
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} />
      </div>

      {/* Aviso de dados em falta */}
      {resumo && (
        <div className="card p-4 mb-5 flex items-start gap-3">
          <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
          <div className="text-sm text-neutral-600">
            Os indicadores só aparecem quando existem dados suficientes para os calcular.
            Indicadores marcados como "—" precisam de mais registos (pesagens, vendas, etc.).
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {indicadores.map((ind) => (
          <div
            key={ind.label}
            className={`card p-4 ${!ind.available ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-700">{ind.label}</span>
                  {ind.available && ind.good === true && (
                    <TrendingUp size={16} className="text-brand-600" />
                  )}
                  {ind.available && ind.good === false && (
                    <TrendingDown size={16} className="text-danger" />
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{ind.explanation}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xl font-bold tabular-nums ${
                  !ind.available ? 'text-neutral-300' :
                  ind.good === false ? 'text-danger' :
                  ind.good === true ? 'text-brand-700' :
                  'text-neutral-800'
                }`}>
                  {ind.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
