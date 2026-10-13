import { useMemo, useState } from 'react';
import { Wheat, Plus, Trash2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoRacao, TipoRacao } from '../types';
import {
  calcularResumoLote,
  formatarData,
  formatarMZN,
  formatarNumero,
  hojeISO,
  sortPorData,
  validarNaoNegativo,
  validarDataRegisto,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const TIPOS: { value: TipoRacao; label: string }[] = [
  { value: 'pre-inicial', label: 'Pré-inicial' },
  { value: 'inicial', label: 'Inicial' },
  { value: 'crescimento', label: 'Crescimento' },
  { value: 'acabamento', label: 'Acabamento' },
];

interface RacaoViewProps {
  data: AppData;
}

export default function RacaoView({ data }: RacaoViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    data: hojeISO(),
    marca: '',
    tipo: 'inicial' as TipoRacao,
    quantidadeComprada: '',
    quantidadeConsumida: '',
    precoPorKg: '',
  });
  const [error, setError] = useState<string | null>(null);

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');
  const selectedId = loteId || lotesAtivos[0]?.id || null;
  const lote = data.lotes.find((l) => l.id === selectedId);
  const resumo = useMemo(
    () =>
      lote
        ? calcularResumoLote(lote, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas)
        : null,
    [lote, data]
  );

  const registos = useMemo(
    () => sortPorData(data.racao.filter((r) => r.loteId === selectedId)),
    [data.racao, selectedId]
  );

  function resetForm() {
    setForm({ data: hojeISO(), marca: '', tipo: 'inicial', quantidadeComprada: '', quantidadeConsumida: '', precoPorKg: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const comprada = Number(form.quantidadeComprada) || 0;
    const consumida = Number(form.quantidadeConsumida) || 0;
    const preco = Number(form.precoPorKg) || 0;

    if (validarNaoNegativo(comprada)) { setError(validarNaoNegativo(comprada)!); return; }
    if (validarNaoNegativo(consumida)) { setError(validarNaoNegativo(consumida)!); return; }
    if (validarNaoNegativo(preco)) { setError(validarNaoNegativo(preco)!); return; }
    if (comprada === 0 && consumida === 0) {
      setError('Registe quantidade comprada ou consumida');
      return;
    }
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }

    // Validar stock: não pode consumir mais do que o stock atual + esta compra
    const stockAtual = resumo?.stockRacao ?? 0;
    const stockAposCompra = stockAtual + comprada;
    if (consumida > stockAposCompra) {
      setError(`Não pode consumir ${consumida} kg. Stock disponível após esta compra será ${stockAposCompra} kg.`);
      return;
    }

    const reg: RegistoRacao = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      marca: form.marca.trim(),
      tipo: form.tipo,
      quantidadeComprada: comprada,
      quantidadeConsumida: consumida,
      precoPorKg: preco,
      createdAt: new Date().toISOString(),
    };
    await data.salvar('racao', reg);
    setModalOpen(false);
    resetForm();
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Ração" subtitle="Gestão de ração comprada e consumida" icon={<Wheat size={22} />} />
        <EmptyState icon={<Wheat size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar ração." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ração"
        subtitle="Gestão de ração comprada e consumida"
        icon={<Wheat size={22} />}
        action={
          <button
            className="btn-primary"
            disabled={!selectedId}
            onClick={() => { resetForm(); setModalOpen(true); }}
          >
            <Plus size={18} /> Registar
          </button>
        }
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} onlyAtivos />
      </div>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Ração Comprada" value={`${formatarNumero(resumo.racaoCompradaTotal, 0)} kg`} color="warning" />
          <StatCard label="Ração Consumida" value={`${formatarNumero(resumo.racaoConsumidaTotal, 0)} kg`} color="warning" />
          <StatCard label="Stock Atual" value={`${formatarNumero(resumo.stockRacao, 0)} kg`} color="brand" />
          <StatCard label="Custo Ração Comprada" value={formatarMZN(resumo.custoRacaoComprada)} color="neutral" />
          <StatCard label="Custo Ração Consumida" value={formatarMZN(resumo.custoRacaoConsumida)} color="neutral" />
        </div>
      )}

      {resumo && resumo.consumoRacaoPorAve != null && (
        <div className="card p-4 mb-5 text-sm">
          <span className="text-neutral-500">Consumo médio por frango vivo: </span>
          <span className="font-bold text-neutral-800">{formatarNumero(resumo.consumoRacaoPorAve, 3)} kg</span>
        </div>
      )}

      {registos.length === 0 ? (
        <EmptyState icon={<Wheat size={40} />} title="Sem registos de ração" description="Não há ração registada para este lote." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-left px-4 py-3 font-semibold">Marca</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold">Comprada (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold">Consumida (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold">Preço/kg</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {registos.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(r.data)}</td>
                    <td className="px-4 py-3 text-neutral-600">{r.marca || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-amber-100 text-amber-700 capitalize">
                        {TIPOS.find((t) => t.value === r.tipo)?.label || r.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarNumero(r.quantidadeComprada, 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarNumero(r.quantidadeConsumida, 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarMZN(r.precoPorKg)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatarMZN(r.quantidadeComprada * r.precoPorKg)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('racao', r.id)}>
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

      <Modal open={modalOpen} title="Registar Ração" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Data *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Marca da Ração</label>
              <input className="input" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ex: Novo Ração" />
            </div>
            <div>
              <label className="label">Tipo de Ração</label>
              <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoRacao })}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade Comprada (kg)</label>
              <input type="number" step="0.1" className="input" value={form.quantidadeComprada} onChange={(e) => setForm({ ...form, quantidadeComprada: e.target.value })} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Quantidade Consumida (kg)</label>
              <input type="number" step="0.1" className="input" value={form.quantidadeConsumida} onChange={(e) => setForm({ ...form, quantidadeConsumida: e.target.value })} placeholder="0" min="0" />
            </div>
          </div>
          <div>
            <label className="label">Preço por kg (MT)</label>
            <input type="number" step="0.01" className="input" value={form.precoPorKg} onChange={(e) => setForm({ ...form, precoPorKg: e.target.value })} placeholder="0.00" min="0" />
          </div>
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
            Registe a ração comprada e a ração efetivamente consumida separadamente. O stock é calculado automaticamente (comprada - consumida).
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
