import {
  Bird,
  Package,
  Skull,
  Wheat,
  HeartPulse,
  Wallet,
  TrendingUp,
  Target,
  MessageCircle,
  Mail,
  WifiOff,
  ShoppingCart,
  Scale,
  Droplets,
} from 'lucide-react';

const features = [
  { icon: <Package size={20} />, title: 'Gestão de lotes', desc: 'Registo e acompanhamento de lotes e aves.' },
  { icon: <Skull size={20} />, title: 'Controlo de mortalidade', desc: 'Acompanhamento da mortalidade e sobrevivência.' },
  { icon: <Wheat size={20} />, title: 'Consumo de ração', desc: 'Gestão do consumo de ração por lote.' },
  { icon: <HeartPulse size={20} />, title: 'Saúde e tratamentos', desc: 'Registo de vacinas, medicamentos e tratamentos.' },
  { icon: <Wallet size={20} />, title: 'Despesas e receitas', desc: 'Controlo financeiro da exploração.' },
  { icon: <ShoppingCart size={20} />, title: 'Vendas', desc: 'Registo de vendas e receitas.' },
  { icon: <TrendingUp size={20} />, title: 'Relatórios', desc: 'Desempenho produtivo e financeiro.' },
  { icon: <WifiOff size={20} />, title: 'Funcionamento offline', desc: 'Principais operações disponíveis sem internet.' },
];

const extraFeatures = [
  { icon: <Scale size={18} />, label: 'Pesagens' },
  { icon: <Droplets size={18} />, label: 'Controlo de água' },
];

export default function SobreView() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden mb-5">
        <div className="hero-banner p-6 md:p-10 text-center">
          <div className="hero-mark mx-auto mb-4"><Bird size={36} /></div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">AVEGESTOR</h1>
          <p className="text-brand-100 text-sm md:text-base mt-2 font-bold">by AgroConnect · Gestão Inteligente de Aves</p>
        </div>
        <div className="p-5 md:p-8">
          <p className="text-sm md:text-base text-neutral-600 leading-7">
            O AVEGESTOR by AgroConnect é uma aplicação desenvolvida para facilitar a gestão de criações de aves,
            ajudando os produtores a controlar os seus lotes, acompanhar a mortalidade, gerir a alimentação, registar
            despesas e receitas e avaliar os resultados da produção.
          </p>
          <p className="text-sm md:text-base text-neutral-600 leading-7 mt-3">
            Com uma interface simples e intuitiva, permite organizar as informações da criação, acompanhar o desempenho
            das aves e tomar decisões com base nos dados registados.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-brand-900 mb-4">Principais funcionalidades</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
              <div className="feature-icon-green">{f.icon}</div>
              <div>
                <p className="font-bold text-brand-900 text-sm">{f.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {extraFeatures.map((f) => (
            <span key={f.label} className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-800 px-3 py-1.5 text-xs font-bold">
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-5 md:p-8 mb-5 mission-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="mission-icon"><Target size={24} /></div>
          <h2 className="text-lg font-extrabold text-white">A nossa missão</h2>
        </div>
        <p className="text-sm md:text-base text-brand-100 leading-7">
          Ajudar os criadores de frangos de corte a melhorar a organização, o controlo e a rentabilidade das suas
          explorações através da tecnologia.
        </p>
      </div>

      <div className="card p-5 md:p-8 mb-5">
        <h2 className="text-lg font-extrabold text-brand-900 mb-4">Desenvolvido e comercializado por</h2>
        <p className="font-bold text-neutral-800 text-base">Pedro António Pedro, Técnico Pecuário</p>
        <p className="text-sm text-neutral-500 leading-6 mt-2">AVEGESTOR by AgroConnect — Idealizado e desenvolvido por Pedro António Pedro, Técnico Pecuário.</p>
        <div className="mt-4 space-y-2">
          <a className="contact-link" href="https://wa.me/258865831887" target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> +258 865831887
          </a>
          <a className="contact-link" href="mailto:pedroantoniopedro45@gmail.com">
            <Mail size={18} /> pedroantoniopedro45@gmail.com
          </a>
        </div>
      </div>

      <div className="card p-6 md:p-8 text-center tagline-card">
        <p className="text-lg md:text-xl font-extrabold text-white tracking-tight">
          AVEGESTOR by AgroConnect — Mais controlo, melhores decisões, maior produtividade.
        </p>
      </div>

      <div className="text-center px-4 pb-4">
        <p className="text-xs text-neutral-500 leading-5">AVEGESTOR by AgroConnect — Idealizado e desenvolvido por Pedro António Pedro, Técnico Pecuário. © 2026 — Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
