import { useMemo, useState } from 'react';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoDespesa, CategoriaDespesa } from '../types';
import {
  formatarData,
  formatarMZN,
  hojeISO,
  sortPorData,
  validarPositivo,
  validarDataRegisto,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CATEGORIAS: { value: CategoriaDespesa; label: string }[] = [
  { value: 'pintos', label: 'Compra de Pintos' },
  { value: 'racao', label: 'Ração' },
  { value: 'vacinas', label: 'Vacinas' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'vitaminas', label: 'Vitaminas' },
  { value: 'cama', label: 'Cama e Maravalha' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'mao-obra', label: 'Mão de Obra' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'aquecimento', label: 'Aquecimento' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'outras', label: 'Outras Despesas' },
];

function catLabel(v: CategoriaDespesa): string {
  return CATEGORIAS.find((c) => c.value === v)?.label || v;
}

interface DespesasViewProps {
  data: AppData;
}

export default function DespesasView({ data }: DespesasViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    data: hojeISO(),
    categoria: 'racao' as CategoriaDespesa,
    descricao: '',
    valor: '',
  });
  const [error, setError] = useState<string | null>(null);

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');
  const selectedId = loteId || lotesAtivos[0]?.id || null;

  const registos = useMemo(
    () => sortPorData(data.despesas.filter((d) => d.loteId === selectedId)),
    [data.despesas, selectedId]
  );

  const totalDespesas = registos.reduce((s, d) => s + d.valor, 0);

  // Dados para gráfico por categoria
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of registos) {
      const label = catLabel(d.categoria);
      map.set(label, (map.get(label) || 0) + d.valor);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [registos]);

  function resetForm() {
    setForm({ data: hojeISO(), categoria: 'racao', descricao: '', valor: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const v = Number(form.valor);
    if (validarPositivo(v)) { setError('Valor inválido'); return; }
    const lote = data.lotes.find((l) => l.id === selectedId);
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }

    const reg: RegistoDespesa = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: v,
      createdAt: new Date().toISOString(),
    };
    await data.salvar('despesas', reg);
    setModalOpen(false);
    resetForm();
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Despesas" subtitle="Registo de despesas por lote" icon={<Wallet size={22} />} />
        <EmptyState icon={<Wallet size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar despesas." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Despesas"
        subtitle="Registo de despesas por lote"
        icon={<Wallet size={22} />}
        action={
          <button className="btn-primary" disabled={!selectedId} onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus size={18} /> Registar
          </button>
        }
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total de Despesas" value={formatarMZN(totalDespesas)} color="neutral" />
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-sm font-bold text-neutral-700 mb-3">Despesas por Categoria</h3>
          {porCategoria.length > 0 ? (
            <BarChart data={porCategoria} color="#dc2626" formatValue={(v) => formatarMZN(v)} height={180} />
          ) : (
            <div className="text-sm text-neutral-400 text-center py-8">Sem dados</div>
          )}
        </div>
      </div>

      {registos.length === 0 ? (
        <EmptyState icon={<Wallet size={40} />} title="Sem despesas" description="Registe as despesas associadas a este lote." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {registos.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(d.data)}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-neutral-100 text-neutral-600">{catLabel(d.categoria)}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{d.descricao || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">{formatarMZN(d.valor)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('despesas', d.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 font-bold text-neutral-700">
                <tr>
                  <td colSpan={3} className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatarMZN(totalDespesas)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} title="Registar Despesa" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Data *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoria *</label>
            <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaDespesa })}>
              {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: 10 sacos de ração inicial" />
          </div>
          <div>
            <label className="label">Valor (MT) *</label>
            <input type="number" step="0.01" className="input" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0.00" min="0" />
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
