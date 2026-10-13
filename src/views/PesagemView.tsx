import { useMemo, useState } from 'react';
import { Scale, Plus, Trash2, Target } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoPesagem, MetaCrescimento, Linhagem } from '../types';
import {
  formatarData,
  formatarNumero,
  idadeSemanas,
  hojeISO,
  sortPorData,
  validarPositivo,
  validarDataRegisto,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const LINHAGENS: Linhagem[] = ['Ross', 'Cobb', 'Hubbard', 'Cobb-Vantress', 'Outra'];

interface PesagemViewProps {
  data: AppData;
}

export default function PesagemView({ data }: PesagemViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [form, setForm] = useState({
    data: hojeISO(),
    numeroAvesPesadas: '',
    pesoTotal: '',
  });
  const [metaForm, setMetaForm] = useState({ linhagem: 'Ross' as Linhagem, semana: '', pesoMeta: '' });
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');
  const selectedId = loteId || lotesAtivos[0]?.id || null;
  const lote = data.lotes.find((l) => l.id === selectedId);

  const registos = useMemo(
    () =>
      [...data.pesagens.filter((p) => p.loteId === selectedId)].sort((a, b) =>
        a.data.localeCompare(b.data)
      ),
    [data.pesagens, selectedId]
  );

  const metasLote = useMemo(
    () => (lote ? data.metas.filter((m) => m.linhagem === lote.linhagem).sort((a, b) => a.semana - b.semana) : []),
    [data.metas, lote]
  );

  // Dados para o gráfico
  const chartData = registos.map((p) => ({
    label: `${idadeSemanas(lote!.dataChegada)}s`,
    value: p.numeroAvesPesadas > 0 ? p.pesoTotal / p.numeroAvesPesadas : 0,
  }));

  // Meta line alinhada por semana
  const metaValues = metasLote.map((m) => m.pesoMeta);
  const metaLine =
    metaValues.length > 0
      ? { label: 'Meta', values: metaValues }
      : undefined;

  const ultimaPesagem = registos[registos.length - 1];
  const pesoMedioAtual =
    ultimaPesagem && ultimaPesagem.numeroAvesPesadas > 0
      ? ultimaPesagem.pesoTotal / ultimaPesagem.numeroAvesPesadas
      : null;

  function resetForm() {
    setForm({ data: hojeISO(), numeroAvesPesadas: '', pesoTotal: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const n = Number(form.numeroAvesPesadas);
    const pt = Number(form.pesoTotal);
    if (validarPositivo(n)) { setError('Número de aves pesadas inválido'); return; }
    if (validarPositivo(pt)) { setError('Peso total inválido'); return; }
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }
    if (pt > 0 && n > 0 && pt / n > 10) {
      if (!confirm(`O peso médio por frango é ${formatarNumero(pt / n, 2)} kg. Confirma que estes valores estão corretos?`)) return;
    }

    const reg: RegistoPesagem = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      numeroAvesPesadas: n,
      pesoTotal: pt,
      createdAt: new Date().toISOString(),
    };
    await data.salvar('pesagens', reg);
    setModalOpen(false);
    resetForm();
  }

  async function salvarMeta() {
    const sem = Number(metaForm.semana);
    const pm = Number(metaForm.pesoMeta);
    if (validarPositivo(sem)) { setMetaError('Semana inválida'); return; }
    if (validarPositivo(pm)) { setMetaError('Peso meta inválido'); return; }

    const meta: MetaCrescimento = {
      id: generateId(),
      linhagem: metaForm.linhagem,
      semana: sem,
      pesoMeta: pm,
    };
    await data.salvar('metas', meta);
    setMetaModalOpen(false);
    setMetaForm({ linhagem: 'Ross', semana: '', pesoMeta: '' });
    setMetaError(null);
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Pesagem e Crescimento" subtitle="Acompanhamento semanal do peso" icon={<Scale size={22} />} />
        <EmptyState icon={<Scale size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar pesagens." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pesagem e Crescimento"
        subtitle="Acompanhamento semanal do peso"
        icon={<Scale size={22} />}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setMetaModalOpen(true)}>
              <Target size={18} /> Metas
            </button>
            <button className="btn-primary" disabled={!selectedId} onClick={() => { resetForm(); setModalOpen(true); }}>
              <Plus size={18} /> Registar
            </button>
          </div>
        }
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} onlyAtivos />
      </div>

      {pesoMedioAtual != null && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <StatCard label="Peso Médio Atual" value={`${formatarNumero(pesoMedioAtual, 3)} kg`} color="brand" />
          <StatCard label="Aves Pesadas" value={formatarNumero(ultimaPesagem!.numeroAvesPesadas, 0)} />
          <StatCard label="Data da Pesagem" value={formatarData(ultimaPesagem!.data)} />
        </div>
      )}

      {/* Gráfico */}
      <div className="card p-5 mb-5">
        <h3 className="section-title mb-4">Evolução do Peso Médio</h3>
        {lote && chartData.length > 0 ? (
          <>
            <LineChart
              data={chartData}
              metaLine={metaLine}
              yLabel="kg"
              color="#16a34a"
            />
            {metaLine && (
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-brand-600"></span> Peso real
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500"></span> Meta ({lote.linhagem})
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-neutral-400 py-8">
            Sem pesagens registadas. O gráfico aparecerá aqui após a primeira pesagem.
          </div>
        )}
      </div>

      {/* Metas configuradas */}
      {lote && metasLote.length > 0 && (
        <div className="card p-4 mb-5">
          <h3 className="text-sm font-bold text-neutral-700 mb-3">
            Metas de Crescimento — {lote.linhagem}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metasLote.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm">
                <span className="font-semibold">Sem {m.semana}:</span>
                <span>{formatarNumero(m.pesoMeta, 2)} kg</span>
                <button className="text-amber-500 hover:text-red-600" onClick={() => data.eliminar('metas', m.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de pesagens */}
      {registos.length === 0 ? (
        <EmptyState icon={<Scale size={40} />} title="Sem pesagens" description="Registe a primeira pesagem semanal para acompanhar o crescimento." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-right px-4 py-3 font-semibold">Aves Pesadas</th>
                  <th className="text-right px-4 py-3 font-semibold">Peso Total (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold">Peso Médio (kg)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortPorData(registos).map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(p.data)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.numeroAvesPesadas}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarNumero(p.pesoTotal, 2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-brand-700">
                      {p.numeroAvesPesadas > 0 ? formatarNumero(p.pesoTotal / p.numeroAvesPesadas, 3) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('pesagens', p.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de pesagem */}
      <Modal open={modalOpen} title="Registar Pesagem" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Data da Pesagem *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Número de Frangos Pesados *</label>
              <input type="number" className="input" value={form.numeroAvesPesadas} onChange={(e) => setForm({ ...form, numeroAvesPesadas: e.target.value })} placeholder="Ex: 50" min="1" />
            </div>
            <div>
              <label className="label">Peso Total (kg) *</label>
              <input type="number" step="0.01" className="input" value={form.pesoTotal} onChange={(e) => setForm({ ...form, pesoTotal: e.target.value })} placeholder="Ex: 100.5" min="0" />
            </div>
          </div>
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
            O peso médio é calculado automaticamente: peso total / número de aves pesadas.
          </div>
          {error && <div className="text-sm text-danger bg-red-50 rounded-lg p-3">{error}</div>}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={salvar}>Guardar</button>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de metas */}
      <Modal open={metaModalOpen} title="Configurar Meta de Crescimento" onClose={() => setMetaModalOpen(false)}>
        <div className="space-y-4">
          <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
            Defina as metas de peso por semana para a linhagem dos seus frangos. Consulte o seu veterinário ou a documentação da linhagem para os valores de referência.
          </div>
          <div>
            <label className="label">Linhagem</label>
            <select className="input" value={metaForm.linhagem} onChange={(e) => setMetaForm({ ...metaForm, linhagem: e.target.value as Linhagem })}>
              {LINHAGENS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Semana</label>
              <input type="number" className="input" value={metaForm.semana} onChange={(e) => setMetaForm({ ...metaForm, semana: e.target.value })} placeholder="Ex: 1" min="1" />
            </div>
            <div>
              <label className="label">Peso Meta (kg)</label>
              <input type="number" step="0.001" className="input" value={metaForm.pesoMeta} onChange={(e) => setMetaForm({ ...metaForm, pesoMeta: e.target.value })} placeholder="Ex: 0.180" min="0" />
            </div>
          </div>
          {/* Lista de metas existentes */}
          {data.metas.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
              <p className="text-xs font-semibold text-neutral-500 uppercase">Metas configuradas</p>
              {data.metas.sort((a, b) => a.linhagem.localeCompare(b.linhagem) || a.semana - b.semana).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                  <span>{m.linhagem} — Sem {m.semana}: {formatarNumero(m.pesoMeta, 3)} kg</span>
                  <button className="text-danger" onClick={() => data.eliminar('metas', m.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {metaError && <div className="text-sm text-danger bg-red-50 rounded-lg p-3">{metaError}</div>}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={salvarMeta}>Adicionar Meta</button>
            <button className="btn-secondary" onClick={() => setMetaModalOpen(false)}>Fechar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
