import { useMemo, useState } from 'react';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoAgua } from '../types';
import {
  calcularResumoAgua,
  calcularResumoLote,
  formatarData,
  formatarNumero,
  formatarPercentagem,
  hojeISO,
  sortPorData,
  validarNaoNegativo,
  validarDataRegisto,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface AguaViewProps {
  data: AppData;
}

export default function AguaView({ data }: AguaViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ data: hojeISO(), quantidade: '', observacoes: '' });
  const [error, setError] = useState<string | null>(null);

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');
  const selectedId = loteId || lotesAtivos[0]?.id || null;
  const lote = data.lotes.find((l) => l.id === selectedId);

  const resumoLote = useMemo(
    () => (lote ? calcularResumoLote(lote, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas) : null),
    [lote, data]
  );

  const resumoAgua = useMemo(
    () =>
      resumoLote
        ? calcularResumoAgua(selectedId || '', data.agua, resumoLote.vivosNaoVendidos)
        : null,
    [resumoLote, selectedId, data.agua]
  );

  const registos = useMemo(
    () => sortPorData(data.agua.filter((a) => a.loteId === selectedId)),
    [data.agua, selectedId]
  );

  const chartData = useMemo(
    () =>
      [...data.agua.filter((a) => a.loteId === selectedId)]
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(-14)
        .map((a) => ({
          label: a.data.slice(8) + '/' + a.data.slice(5, 7),
          value: a.quantidade,
        })),
    [data.agua, selectedId]
  );

  function resetForm() {
    setForm({ data: hojeISO(), quantidade: '', observacoes: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const q = Number(form.quantidade);
    if (validarNaoNegativo(q)) { setError(validarNaoNegativo(q)!); return; }
    if (q === 0) { setError('A quantidade deve ser maior que zero'); return; }
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }

    const reg: RegistoAgua = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      quantidade: q,
      observacoes: form.observacoes.trim(),
      createdAt: new Date().toISOString(),
    };
    await data.salvar('agua', reg);
    setModalOpen(false);
    resetForm();
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Água" subtitle="Controlo de consumo diário de água" icon={<Droplets size={22} />} />
        <EmptyState icon={<Droplets size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar consumo de água." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Água"
        subtitle="Controlo de consumo diário de água"
        icon={<Droplets size={22} />}
        action={
          <button className="btn-primary" disabled={!selectedId} onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus size={18} /> Registar
          </button>
        }
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} onlyAtivos />
      </div>

      {resumoAgua && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Consumido" value={`${formatarNumero(resumoAgua.totalLitros, 0)} L`} color="info" />
          <StatCard label="Média Diária" value={`${formatarNumero(resumoAgua.mediaDiaria, 0)} L`} color="info" />
          <StatCard
            label="Consumo por Ave"
            value={resumoAgua.porAve != null ? `${formatarNumero(resumoAgua.porAve, 0)} mL` : '—'}
            color="brand"
          />
          <StatCard
            label="Variação"
            value={resumoAgua.variacao != null ? formatarPercentagem(resumoAgua.variacao) : '—'}
            color={resumoAgua.variacao != null && resumoAgua.variacao > 20 ? 'warning' : 'neutral'}
          />
        </div>
      )}

      {/* Gráfico */}
      <div className="card p-5 mb-5">
        <h3 className="section-title mb-4">Consumo Diário (últimos 14 dias)</h3>
        <LineChart data={chartData} color="#0ea5e9" height={220} yLabel="L" />
      </div>

      {registos.length === 0 ? (
        <EmptyState icon={<Droplets size={40} />} title="Sem registos de água" description="Registe o consumo diário de água para acompanhar a variação." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-right px-4 py-3 font-semibold">Quantidade (L)</th>
                  <th className="text-left px-4 py-3 font-semibold">Observações</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {registos.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(a.data)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-sky-700">{formatarNumero(a.quantidade, 0)}</td>
                    <td className="px-4 py-3 text-neutral-500 max-w-xs truncate">{a.observacoes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('agua', a.id)}>
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

      <Modal open={modalOpen} title="Registar Consumo de Água" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Data *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div>
            <label className="label">Quantidade Consumida (litros) *</label>
            <input type="number" step="0.1" className="input" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="Ex: 150" min="0" />
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
    </div>
  );
}
