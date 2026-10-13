import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Layout, { type ViewName } from './components/Layout';
import { useAppData } from './hooks/useAppData';
import { useLicense } from './hooks/useLicense';
import Dashboard from './views/Dashboard';
import LotesView from './views/LotesView';
import MortalidadeView from './views/MortalidadeView';
import RacaoView from './views/RacaoView';
import PesagemView from './views/PesagemView';
import AguaView from './views/AguaView';
import SaudeView from './views/SaudeView';
import DespesasView from './views/DespesasView';
import VendasView from './views/VendasView';
import IndicadoresView from './views/IndicadoresView';
import LicenseView from './views/LicenseView';
import SobreView from './views/SobreView';

export default function App() {
  const [view, setView] = useState<ViewName>('dashboard');
  const data = useAppData();
  const { state, activateLicense, deactivateLicense } = useLicense();

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100">
        <div className="text-center">
          <Loader2 size={36} className="text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">A verificar licença...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'none' || state.status === 'invalid') {
    return (
      <LicenseView
        onActivate={activateLicense}
        onDeactivate={deactivateLicense}
        license={null}
        error={state.status === 'invalid' ? state.error : null}
      />
    );
  }

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-neutral-500">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      current={view}
      onNavigate={setView}
      licenseInfo={state.license}
      onDeactivateLicense={deactivateLicense}
    >
      {view === 'dashboard' && <Dashboard data={data} onNavigate={setView} />}
      {view === 'lotes' && <LotesView data={data} />}
      {view === 'mortalidade' && <MortalidadeView data={data} />}
      {view === 'racao' && <RacaoView data={data} />}
      {view === 'pesagem' && <PesagemView data={data} />}
      {view === 'agua' && <AguaView data={data} />}
      {view === 'saude' && <SaudeView data={data} />}
      {view === 'despesas' && <DespesasView data={data} />}
      {view === 'vendas' && <VendasView data={data} />}
      {view === 'indicadores' && <IndicadoresView data={data} />}
      {view === 'sobre' && <SobreView />}
    </Layout>
  );
}
