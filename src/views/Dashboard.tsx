import { useMemo, type ReactNode } from 'react';
import {
  Bird,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  Skull,
  TrendingUp,
  Wallet,
  Wheat,
} from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import { calcularResumoLote, formatarMZN, formatarNumero, formatarPercentagem } from '../utils/calculos';
import EmptyState from '../components/EmptyState';
import type { ViewName } from '../components/Layout';

interface DashboardProps {
  data: AppData;
  onNavigate: (v: ViewName) => void;
}

export default function Dashboard({ data, onNavigate }: DashboardProps) {
  const resumos = useMemo(
    () => data.lotes.map((lote) => calcularResumoLote(lote, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas)),
    [data]
  );
  const lotesAtivos = resumos.filter((resumo) => resumo.lote.estado === 'ativo');
  const totalVivos = lotesAtivos.reduce((sum, resumo) => sum + resumo.vivosNaoVendidos, 0);
  const totalDespesas = resumos.reduce((sum, resumo) => sum + resumo.totalDespesas, 0);
  const totalReceitas = resumos.reduce((sum, resumo) => sum + resumo.totalReceitas, 0);
  const lucroTotal = totalReceitas - totalDespesas;
  const racaoConsumida = resumos.reduce((sum, resumo) => sum + resumo.racaoConsumidaTotal, 0);
  const mortalidadeMedia = lotesAtivos.length > 0 ? lotesAtivos.reduce((sum, resumo) => sum + resumo.taxaMortalidade, 0) / lotesAtivos.length : 0;

  if (data.lotes.length === 0) {
    return (
      <div className="space-y-6">
        <WelcomeBanner onNavigate={onNavigate} />
        <EmptyState icon={<Package size={48} />} title="Comece pelo seu primeiro lote" description="Registe os pintos, custos e evolução do lote para acompanhar a produção com clareza." action={<button className="btn-primary" onClick={() => onNavigate('lotes')}><Plus size={18} /> Criar primeiro lote</button>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner onNavigate={onNavigate} hasData />

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="eyebrow">Visão geral</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900 tracking-tight">Painel de hoje</h2>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-neutral-500"><CalendarDays size={15} /> {new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long' })}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <FeatureStat label="Aves vivas" value={formatarNumero(totalVivos, 0)} detail={`${lotesAtivos.length} lote${lotesAtivos.length === 1 ? '' : 's'} ativo${lotesAtivos.length === 1 ? '' : 's'}`} icon={<Bird size={22} />} tone="green" />
          <FeatureStat label="Mortalidade" value={formatarPercentagem(mortalidadeMedia)} detail="média dos lotes ativos" icon={<Skull size={22} />} tone="yellow" />
          <FeatureStat label="Ração consumida" value={`${formatarNumero(racaoConsumida, 0)} kg`} detail="consumo registado" icon={<Wheat size={22} />} tone="cream" />
          <FeatureStat label="Lucro acumulado" value={formatarMZN(lucroTotal)} detail={lucroTotal >= 0 ? 'resultado positivo' : 'resultado negativo'} icon={<CircleDollarSign size={22} />} tone="green" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3"><h3 className="section-title">Ações rápidas</h3><span className="text-xs text-neutral-500 font-semibold">Registe em poucos segundos</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction label="Novo lote" detail="Adicionar aves" icon={<Plus size={21} />} onClick={() => onNavigate('lotes')} tone="green" />
          <QuickAction label="Mortalidade" detail="Registar perdas" icon={<Skull size={21} />} onClick={() => onNavigate('mortalidade')} tone="yellow" />
          <QuickAction label="Registar ração" detail="Compras e consumo" icon={<Wheat size={21} />} onClick={() => onNavigate('racao')} tone="green" />
          <QuickAction label="Ver resultados" detail="Lucro e indicadores" icon={<TrendingUp size={21} />} onClick={() => onNavigate('indicadores')} tone="yellow" />
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.35fr_0.65fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4"><div><p className="eyebrow">Produção em curso</p><h3 className="section-title">Os seus lotes</h3></div><button className="text-xs font-extrabold text-brand-700 flex items-center gap-1 hover:text-brand-900" onClick={() => onNavigate('lotes')}>Ver todos <ChevronRight size={15} /></button></div>
          <div className="space-y-2.5">
            {resumos.slice(0, 4).map((resumo) => <div key={resumo.lote.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-brand-50 transition-colors cursor-pointer" onClick={() => onNavigate('lotes')}><div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center"><Bird size={20} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h4 className="font-extrabold text-sm text-neutral-800 truncate">{resumo.lote.nome}</h4><span className="badge bg-brand-100 text-brand-800">{resumo.lote.estado}</span></div><p className="text-xs text-neutral-500 mt-1">{resumo.lote.linhagem} · {formatarNumero(resumo.vivosNaoVendidos, 0)} aves vivas</p></div><div className="text-right"><p className="text-xs text-neutral-400">Idade</p><p className="font-extrabold text-sm text-brand-900">{resumo.idadeSemanas} sem</p></div></div>)}
          </div>
        </div>
        <div className="card bg-brand-900 text-white p-5 overflow-hidden relative"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-800/50" /><div className="relative"><div className="h-10 w-10 rounded-xl bg-accent text-brand-900 flex items-center justify-center mb-5"><Wallet size={21} /></div><p className="text-brand-200 text-sm font-bold">Resumo financeiro</p><p className="text-3xl font-extrabold mt-1">{formatarMZN(lucroTotal)}</p><p className="text-xs text-brand-200 mt-2">Receitas {formatarMZN(totalReceitas)} · Despesas {formatarMZN(totalDespesas)}</p><button onClick={() => onNavigate('indicadores')} className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/20 flex items-center justify-between">Abrir indicadores <ChevronRight size={17} /></button></div></div>
      </section>

      <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold"><Clock3 size={15} className="text-brand-700" /> Os dados são guardados automaticamente no dispositivo e disponíveis offline.</div>
    </div>
  );
}

function WelcomeBanner({ onNavigate, hasData = false }: { onNavigate: (v: ViewName) => void; hasData?: boolean }) {
  return <div className="welcome-banner"><div><p className="text-brand-200 text-xs font-bold uppercase tracking-[0.18em]">AVICONTROL PRO · MOÇAMBIQUE</p><h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">{hasData ? 'Bom dia, produtor.' : 'Bem-vindo ao seu controlo avícola.'}</h1><p className="text-sm text-brand-100/80 mt-2">Acompanhe cada lote, decisão e resultado num só lugar.</p></div><button onClick={() => onNavigate('lotes')} className="hidden sm:inline-flex btn bg-accent text-brand-900 hover:bg-yellow-300"><Plus size={17} /> Novo lote</button></div>;
}

function FeatureStat({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: 'green' | 'yellow' | 'cream' }) {
  return <div className={`feature-stat feature-stat-${tone}`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold opacity-75">{label}</p><p className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 break-words">{value}</p></div><span className="feature-icon">{icon}</span></div><p className="text-[11px] font-semibold opacity-70 mt-3">{detail}</p></div>;
}

function QuickAction({ label, detail, icon, onClick, tone }: { label: string; detail: string; icon: ReactNode; onClick: () => void; tone: 'green' | 'yellow' }) {
  return <button onClick={onClick} className={`quick-action quick-action-${tone}`}><span className="quick-action-icon">{icon}</span><span className="text-left"><span className="block text-sm font-extrabold">{label}</span><span className="block text-[11px] opacity-70 mt-0.5">{detail}</span></span><ChevronRight size={16} className="ml-auto opacity-60" /></button>;
}
