import { useMemo, useState } from 'react';
import { HeartPulse, Plus, Trash2, Bell, CheckCircle2, Syringe, Pill } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoSaude, Lembrete, TipoSaude } from '../types';
import { formatarData, hojeISO, sortPorData } from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const TIPOS: { value: TipoSaude; label: string; icon: typeof Syringe }[] = [
  { value: 'vacinacao', label: 'Vacinação', icon: Syringe },
  { value: 'medicamento', label: 'Medicamento', icon: Pill },
  { value: 'vitamina', label: 'Vitamina', icon: HeartPulse },
  { value: 'suplemento', label: 'Suplemento', icon: HeartPulse },
];

interface SaudeViewProps {
  data: AppData;
}

export default function SaudeView({ data }: SaudeViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lembreteModalOpen, setLembreteModalOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: 'vacinacao' as TipoSaude,
    data: hojeISO(),
    produto: '',
    quantidade: '',
    responsavel: '',
    observacoes: '',
  });
  const [lembreteForm, setLembreteForm] = useState({
    titulo: '',
    data: hojeISO(),
    loteId: '' as string | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'registos' | 'lembretes'>('registos');

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');
  const selectedId = loteId || lotesAtivos[0]?.id || null;

  const registos = useMemo(
    () => sortPorData(data.saude.filter((s) => s.loteId === selectedId)),
    [data.saude, selectedId]
  );

  const lembretes = useMemo(
    () =>
      [...data.lembretes]
        .filter((l) => !lembreteForm.loteId || l.loteId === lembreteForm.loteId)
        .sort((a, b) => a.data.localeCompare(b.data)),
    [data.lembretes, lembreteForm.loteId]
  );

  function resetForm() {
    setForm({ tipo: 'vacinacao', data: hojeISO(), produto: '', quantidade: '', responsavel: '', observacoes: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    if (!form.produto.trim()) { setError('Indique o produto utilizado'); return; }

    const reg: RegistoSaude = {
      id: generateId(),
      loteId: selectedId,
      tipo: form.tipo,
      data: form.data,
      produto: form.produto.trim(),
      quantidade: form.quantidade.trim(),
      responsavel: form.responsavel.trim(),
      observacoes: form.observacoes.trim(),
      createdAt: new Date().toISOString(),
    };
    await data.salvar('saude', reg);
    setModalOpen(false);
    resetForm();
  }

  async function salvarLembrete() {
    if (!lembreteForm.titulo.trim()) return;
    const lem: Lembrete = {
      id: generateId(),
      loteId: lembreteForm.loteId || null,
      titulo: lembreteForm.titulo.trim(),
      data: lembreteForm.data,
      feito: false,
      createdAt: new Date().toISOString(),
    };
    await data.salvar('lembretes', lem);
    setLembreteModalOpen(false);
    setLembreteForm({ titulo: '', data: hojeISO(), loteId: '' });
  }

  async function toggleLembrete(lem: Lembrete) {
    await data.salvar('lembretes', { ...lem, feito: !lem.feito });
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Saúde e Biossegurança" subtitle="Vacinações, medicamentos e lembretes" icon={<HeartPulse size={22} />} />
        <EmptyState icon={<HeartPulse size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar dados de saúde." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Saúde e Biossegurança"
        subtitle="Vacinações, medicamentos e lembretes"
        icon={<HeartPulse size={22} />}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setLembreteModalOpen(true)}>
              <Bell size={18} /> Lembrete
            </button>
            <button className="btn-primary" disabled={!selectedId && tab === 'registos'} onClick={() => { resetForm(); setModalOpen(true); }}>
              <Plus size={18} /> Registar
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`btn btn-sm ${tab === 'registos' ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
          onClick={() => setTab('registos')}
        >
          Registos de Saúde
        </button>
        <button
          className={`btn btn-sm ${tab === 'lembretes' ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
          onClick={() => setTab('lembretes')}
        >
          Lembretes
        </button>
      </div>

      {tab === 'registos' && (
        <>
          <div className="mb-4">
            <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} onlyAtivos />
          </div>

          {registos.length === 0 ? (
            <EmptyState icon={<HeartPulse size={40} />} title="Sem registos de saúde" description="Registre vacinações, medicamentos, vitaminas e suplementos administrados." />
          ) : (
            <div className="space-y-2">
              {registos.map((s) => {
                const tipoInfo = TIPOS.find((t) => t.value === s.tipo);
                const Icon = tipoInfo?.icon || HeartPulse;
                return (
                  <div key={s.id} className="card p-4 flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      s.tipo === 'vacinacao' ? 'bg-sky-50 text-sky-700' :
                      s.tipo === 'medicamento' ? 'bg-red-50 text-red-700' :
                      'bg-brand-50 text-brand-700'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge bg-neutral-100 text-neutral-600">{tipoInfo?.label}</span>
                        <span className="text-sm font-semibold text-neutral-700">{s.produto}</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 flex flex-wrap gap-3">
                        <span>{formatarData(s.data)}</span>
                        {s.quantidade && <span>Qt: {s.quantidade}</span>}
                        {s.responsavel && <span>Resp: {s.responsavel}</span>}
                      </div>
                      {s.observacoes && (
                        <p className="text-sm text-neutral-500 mt-1">{s.observacoes}</p>
                      )}
                    </div>
                    <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('saude', s.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'lembretes' && (
        <>
          {lembretes.length === 0 ? (
            <EmptyState
              icon={<Bell size={40} />}
              title="Sem lembretes"
              description="Crie lembretes para tarefas sanitárias e de maneio. Os planos sanitários devem seguir a orientação do seu veterinário."
              action={
                <button className="btn-primary" onClick={() => setLembreteModalOpen(true)}>
                  <Bell size={18} /> Criar Lembrete
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {lembretes.map((l) => {
                const loteNome = l.loteId ? data.lotes.find((lot) => lot.id === l.loteId)?.nome : null;
                const overdue = !l.feito && l.data < hojeISO();
                return (
                  <div key={l.id} className={`card p-4 flex items-center gap-3 ${l.feito ? 'opacity-60' : ''}`}>
                    <button onClick={() => toggleLembrete(l)} className="shrink-0">
                      {l.feito ? (
                        <CheckCircle2 size={22} className="text-brand-600" />
                      ) : (
                        <Bell size={22} className={overdue ? 'text-danger' : 'text-amber-500'} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${l.feito ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
                        {l.titulo}
                      </div>
                      <div className="text-xs text-neutral-500 flex gap-3 mt-0.5">
                        <span className={overdue ? 'text-danger font-semibold' : ''}>
                          {formatarData(l.data)}
                          {overdue ? ' (atrasado)' : ''}
                        </span>
                        {loteNome && <span>{loteNome}</span>}
                      </div>
                    </div>
                    <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('lembretes', l.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de registo de saúde */}
      <Modal open={modalOpen} title="Registar Saúde" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Tipo *</label>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoSaude })}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data de Administração *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div>
            <label className="label">Produto Utilizado *</label>
            <input className="input" value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Ex: Newcastle Vacina" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade Administrada</label>
              <input className="input" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="Ex: 500 ml" />
            </div>
            <div>
              <label className="label">Responsável</label>
              <input className="input" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Ex: Veterinário João" />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[60px] resize-y" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas adicionais..." />
          </div>
          {error && <div className="text-sm text-danger bg-red-50 rounded-lg p-3">{error}</div>}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={salvar}>Guardar</button>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de lembrete */}
      <Modal open={lembreteModalOpen} title="Criar Lembrete" onClose={() => setLembreteModalOpen(false)} size="sm">
        <div className="space-y-4">
          <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
            Os lembretes ajudam a não esquecer tarefas sanitárias e de maneio. Configure conforme a orientação do seu veterinário.
          </div>
          <div>
            <label className="label">Título *</label>
            <input className="input" value={lembreteForm.titulo} onChange={(e) => setLembreteForm({ ...lembreteForm, titulo: e.target.value })} placeholder="Ex: Vacinação Gumboro" />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={lembreteForm.data} onChange={(e) => setLembreteForm({ ...lembreteForm, data: e.target.value })} />
          </div>
          <div>
            <label className="label">Lote (opcional)</label>
            <select className="input" value={lembreteForm.loteId || ''} onChange={(e) => setLembreteForm({ ...lembreteForm, loteId: e.target.value || null })}>
              <option value="">Todos os lotes</option>
              {data.lotes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={salvarLembrete} disabled={!lembreteForm.titulo.trim()}>Criar</button>
            <button className="btn-secondary" onClick={() => setLembreteModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
