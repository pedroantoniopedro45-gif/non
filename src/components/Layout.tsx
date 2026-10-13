import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Skull,
  Wheat,
  Scale,
  Droplets,
  HeartPulse,
  Wallet,
  ShoppingCart,
  TrendingUp,
  X,
  Bird,
  ShieldCheck,
  Info,
  WifiOff,
  ChevronRight,
} from 'lucide-react';

export type ViewName =
  | 'dashboard'
  | 'lotes'
  | 'mortalidade'
  | 'racao'
  | 'pesagem'
  | 'agua'
  | 'saude'
  | 'despesas'
  | 'vendas'
  | 'indicadores'
  | 'sobre';

interface NavItem {
  name: ViewName;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { name: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
  { name: 'lotes', label: 'Lotes', icon: <Package size={20} /> },
  { name: 'mortalidade', label: 'Mortalidade', icon: <Skull size={20} /> },
  { name: 'racao', label: 'Ração', icon: <Wheat size={20} /> },
  { name: 'pesagem', label: 'Pesagem', icon: <Scale size={20} /> },
  { name: 'agua', label: 'Água', icon: <Droplets size={20} /> },
  { name: 'saude', label: 'Saúde', icon: <HeartPulse size={20} /> },
  { name: 'despesas', label: 'Despesas', icon: <Wallet size={20} /> },
  { name: 'vendas', label: 'Vendas', icon: <ShoppingCart size={20} /> },
  { name: 'indicadores', label: 'Relatórios', icon: <TrendingUp size={20} /> },
  { name: 'sobre', label: 'Sobre', icon: <Info size={20} /> },
];

interface LayoutProps {
  current: ViewName;
  onNavigate: (v: ViewName) => void;
  children: ReactNode;
  licenseInfo?: { plan_type: string; key: string } | null;
  onDeactivateLicense?: () => void;
}

export default function Layout({ current, onNavigate, children, licenseInfo, onDeactivateLicense }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(view: ViewName) {
    onNavigate(view);
    setMobileOpen(false);
  }

  const header = (
    <div className="flex items-center gap-3 px-3 py-5">
      <div className="brand-mark">
        <Bird size={25} strokeWidth={2.5} />
      </div>
      <div>
        <h1 className="text-[15px] font-extrabold tracking-tight text-white leading-none">AVEGESTOR</h1>
        <p className="text-[10px] font-bold tracking-[0.18em] text-brand-200 mt-1">BY AGROCONNECT · GESTÃO AVÍCOLA</p>
      </div>
    </div>
  );

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = current === item.name;
        return (
          <button
            key={item.name}
            onClick={() => navigate(item.name)}
            className={`nav-item ${active ? 'nav-item-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {active && <ChevronRight size={15} className="ml-auto opacity-70" />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-app-surface">
      <aside className="hidden md:flex w-64 flex-col bg-brand-950 fixed inset-y-0 left-0 z-30 px-3 shadow-2xl">
        {header}
        <div className="px-2 pb-4">
          <div className="offline-pill">
            <WifiOff size={14} />
            <span>Modo offline disponível</span>
          </div>
        </div>
        {navList}
        <div className="mt-auto pb-5 px-2 space-y-3">
          {licenseInfo && (
            <div className="license-mini">
              <ShieldCheck size={16} className="text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-white">Licença ativa</p>
                <p className="text-[9px] text-brand-200 font-mono truncate">{licenseInfo.key}</p>
              </div>
              {onDeactivateLicense && (
                <button onClick={() => { if (confirm('Desativar a licença neste dispositivo?')) onDeactivateLicense(); }} className="text-[10px] text-brand-300 hover:text-white">Sair</button>
              )}
            </div>
          )}
          <div className="space-y-1 text-center">
            <p className="text-[10px] text-brand-300/70">Dados guardados neste dispositivo</p>
            <p className="text-[9px] leading-4 text-brand-300/60">AVEGESTOR by AgroConnect · © 2026</p>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-30 mobile-topbar">
        <button onClick={() => setMobileOpen(true)} className="brand-mark brand-mark-sm" aria-label="Abrir menu"><Bird size={21} /></button>
        <div className="flex-1 ml-3">
          <p className="text-sm font-extrabold text-white tracking-tight">AVEGESTOR</p>
          <p className="text-[10px] text-brand-200">by AgroConnect · Gestão avícola</p>
        </div>
        <div className="offline-pill offline-pill-compact"><WifiOff size={13} /><span>Offline</span></div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-brand-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="bg-brand-950 w-80 max-w-[88vw] h-full p-3 shadow-2xl fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              {header}
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-brand-100 hover:bg-brand-900"><X size={20} /></button>
            </div>
            {navList}
          </div>
        </div>
      )}

      <main className="md:ml-64 min-h-screen pb-24 md:pb-0">
        <div className="p-4 pt-20 md:p-8 md:pt-8 max-w-7xl mx-auto fade-in" key={current}>
          {children}
        </div>
      </main>

      <nav className="md:hidden mobile-bottom-nav">
        {(['dashboard', 'lotes', 'mortalidade', 'racao', 'indicadores'] as ViewName[]).map((name) => {
          const item = NAV.find((navItem) => navItem.name === name);
          if (!item) return null;
          const active = current === name;
          return <button key={name} onClick={() => navigate(name)} className={`mobile-tab ${active ? 'mobile-tab-active' : ''}`}>{item.icon}<span>{item.label}</span></button>;
        })}
      </nav>
    </div>
  );
}
