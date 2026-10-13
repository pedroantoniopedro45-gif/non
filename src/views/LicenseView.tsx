import { useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Crown,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  Star,
} from 'lucide-react';
import type { LicenseInfo } from '../hooks/useLicense';
import type { LicensePlan } from '../types';
import LicensePurchaseModal from '../components/LicensePurchaseModal';
import AdminLicenseRequestsView from './AdminLicenseRequestsView';

interface LicenseViewProps {
  onActivate: (key: string) => Promise<{ success: boolean; error?: string }>;
  onDeactivate: () => void;
  license: LicenseInfo | null;
  error: string | null;
}

const WHATSAPP_NUMBER = '258865831887';
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: ReactNode;
  tone: 'neutral' | 'featured' | 'premium';
  planType: LicensePlan;
  badge?: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    name: 'Licença Mensal',
    price: '150',
    period: '30 dias',
    description: 'Para começar a organizar a sua produção com flexibilidade.',
    icon: <CalendarDays size={22} />,
    tone: 'neutral',
    planType: 'monthly',
    features: ['Acesso às funcionalidades pagas', 'Gestão de frangos de corte offline', 'Sem assistência técnica personalizada'],
  },
  {
    name: 'Licença Anual',
    price: '250',
    period: '365 dias',
    description: 'A opção mais escolhida para uma gestão contínua e acompanhada.',
    icon: <Star size={22} />,
    tone: 'featured',
    planType: 'yearly',
    badge: 'Mais escolhida',
    features: ['Acesso às funcionalidades pagas', 'Gestão offline dos lotes', 'Assistência técnica virtual', 'Assistência presencial em Beira, Tete e Chimoio, mediante agendamento'],
  },
  {
    name: 'Licença Vitalícia',
    price: '1.500',
    period: 'Permanente',
    description: 'Acesso sem renovação periódica para acompanhar o crescimento da sua criação.',
    icon: <Crown size={22} />,
    tone: 'premium',
    planType: 'lifetime',
    badge: 'Melhor valor',
    features: ['Acesso permanente às funcionalidades incluídas', 'Gestão offline dos lotes', 'Assistência técnica virtual', 'Assistência presencial em Beira, Tete e Chimoio, mediante agendamento'],
  },
];

export default function LicenseView({ onActivate, onDeactivate, license, error }: LicenseViewProps) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  async function handleActivate() {
    setLocalError(null);
    if (!key.trim()) {
      setLocalError('Introduza a chave de licença.');
      return;
    }
    setLoading(true);
    const result = await onActivate(key);
    setLoading(false);
    if (!result.success) setLocalError(result.error || 'Erro ao ativar licença.');
  }

  function formatPlano(plano: string): string {
    const map: Record<string, string> = { trial: 'Trial (Avaliação)', monthly: 'Mensal', yearly: 'Anual', lifetime: 'Vitalícia' };
    return map[plano] || plano;
  }

  function formatExpiry(expiresAt: string | null): string {
    if (!expiresAt) return 'Vitalícia (sem validade)';
    const d = new Date(expiresAt);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (license) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-app-surface">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} className="text-brand-600" /></div>
            <h2 className="text-xl font-bold text-neutral-800 mb-1">Licença Ativa</h2>
            <p className="text-sm text-neutral-500 mb-6">O AVEGESTOR by AgroConnect está licenciado e pronto a usar.</p>
            <div className="space-y-3 text-left bg-neutral-50 rounded-xl p-4 mb-6">
              <InfoRow label="Chave" value={license.key} mono />
              <InfoRow label="Plano" value={formatPlano(license.plan_type)} />
              {license.customer_name && <InfoRow label="Cliente" value={license.customer_name} />}
              <InfoRow label="Válido até" value={formatExpiry(license.expires_at)} />
              <InfoRow label="Dispositivos" value={String(license.max_devices)} />
            </div>
            <button className="btn-secondary w-full text-danger hover:bg-red-50" onClick={onDeactivate}>Desativar Licença</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-surface px-4 py-8 md:py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="card overflow-hidden max-w-4xl mx-auto mb-8 md:mb-10 shadow-lg">
          <img
            src="/WhatsApp_Image_2026-10-11_at_02.46.55.jpeg"
            alt="AVEGESTOR by AgroConnect — gestão avícola"
            className="w-full aspect-square object-cover md:aspect-[16/7]"
          />
        </div>
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <div className="brand-mark mx-auto mb-4"><ShieldCheck size={27} /></div>
          <p className="eyebrow">AVEGESTOR BY AGROCONNECT · MOÇAMBIQUE</p>
          <p className="text-sm font-semibold text-brand-700 mb-2">Bem-vindo à sua gestão avícola</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-900 tracking-tight mt-2">Escolha a sua licença</h1>
          <p className="text-neutral-500 mt-3 text-sm md:text-base">Gestão profissional de aves, com dados guardados no dispositivo e acesso offline.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => <PricingCard key={plan.name} plan={plan} onSelect={setSelectedPlan} />)}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-5">
          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-xl bg-accent/20 text-brand-800 flex items-center justify-center"><MapPin size={20} /></div><h2 className="text-lg font-extrabold text-brand-900">Condições da assistência presencial</h2></div>
            <p className="text-sm text-neutral-600 leading-6">As despesas de transporte e deslocação do responsável serão suportadas pelo criador de aves. O valor deve ser acordado previamente, e o atendimento depende de agendamento e disponibilidade.</p>
          </div>
          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center"><MessageCircle size={20} /></div><h2 className="text-lg font-extrabold text-brand-900">Contactos para aquisição e assistência</h2></div>
            <div className="space-y-2 text-sm"><p className="font-bold text-neutral-800">Responsável: Pedro Antonio Pedro</p><a className="contact-link" href={`${WHATSAPP_BASE}?text=${encodeURIComponent('Olá Pedro, gostaria de adquirir uma licença do AVEGESTOR by AgroConnect.')}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> +258 865831887</a><a className="contact-link" href="mailto:pedroantoniopedro45@gmail.com"><Mail size={16} /> pedroantoniopedro45@gmail.com</a></div>
          </div>
        </div>

        <div className="card max-w-2xl mx-auto mt-6 p-5 md:p-6 border-brand-200 bg-brand-50/60">
          <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-xl bg-white text-brand-800 flex items-center justify-center shadow-sm"><KeyRound size={20} /></div><div><h2 className="text-lg font-extrabold text-brand-900">Já tem uma chave?</h2><p className="text-xs text-neutral-500">Ative a licença para desbloquear o aplicativo.</p></div></div>
          <div className="space-y-3"><input type="text" className="input font-mono text-center text-lg tracking-wider uppercase" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleActivate()} placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={24} autoFocus disabled={loading} />{(localError || error) && <div className="flex items-start gap-2 text-sm text-danger bg-red-50 rounded-lg p-3"><AlertCircle size={18} className="flex-shrink-0 mt-0.5" /><span>{localError || error}</span></div>}<button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleActivate} disabled={loading}>{loading ? <><Loader2 size={18} className="animate-spin" /> A verificar...</> : <><Lock size={18} /> Ativar Licença</>}</button></div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500"><CheckCircle2 size={14} className="text-brand-700" /><span>Funciona offline após ativação</span></div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"><p className="text-center text-xs text-neutral-400">A aquisição é confirmada pelo responsável. Os botões não simulam pagamentos nem ativam licenças automaticamente.</p><button className="text-xs font-bold text-neutral-400 hover:text-brand-700" onClick={() => setAdminOpen(true)}>Área do responsável</button></div>
        {selectedPlan && <LicensePurchaseModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
        {adminOpen && <AdminLicenseRequestsView onClose={() => setAdminOpen(false)} />}
      </div>
    </div>
  );
}

function PricingCard({ plan, onSelect }: { plan: PricingPlan; onSelect: (plan: LicensePlan) => void }) {
  const toneClass = plan.tone === 'featured' ? 'pricing-card-featured' : plan.tone === 'premium' ? 'pricing-card-premium' : 'pricing-card-neutral';
  return <article className={`pricing-card ${toneClass}`}><div className="flex items-start justify-between gap-3"><div className="pricing-icon">{plan.icon}</div>{plan.badge && <span className="pricing-badge">{plan.badge}</span>}</div><h2 className="text-xl font-extrabold mt-5">{plan.name}</h2><p className="text-sm opacity-75 mt-2 min-h-[42px]">{plan.description}</p><div className="flex items-end gap-2 mt-5"><span className="text-4xl font-extrabold tracking-tight">{plan.price}</span><span className="text-sm font-bold mb-1">MZN</span></div><p className="text-xs font-bold opacity-70 mt-1">Validade: {plan.period}</p><div className="border-t border-current/15 my-5" /><ul className="space-y-3 text-sm flex-1">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0" /><span>{feature}</span></li>)}</ul><button className="pricing-button mt-6" onClick={() => onSelect(plan.planType)}><ShoppingCart size={17} /> Adquirir licença</button></article>;
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex justify-between gap-3"><span className="text-neutral-500 text-sm">{label}:</span><span className={`font-semibold text-neutral-700 text-sm text-right ${mono ? 'font-mono' : ''}`}>{value}</span></div>;
}
