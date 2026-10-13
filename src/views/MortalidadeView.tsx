import { useMemo, useState } from 'react';
import { Skull, Plus, Trash2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoMortalidade } from '../types';
import {
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
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface MortalidadeViewProps {
  data: AppData;
}

export default function MortalidadeView({ data }: MortalidadeViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    data: hojeISO(),
    mortos: '',
    descartados: '',
    causa: '',
    observacoes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const lotesAtivos = data.lotes.filter((l) => l.estado === 'ativo');

  // Auto-selecionar primeiro lote ativo
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
    () =>
      sortPorData(
        data.mortalidade.filter((m) => m.loteId === selectedId)
      ),
    [data.mortalidade, selectedId]
  );

  function resetForm() {
    setForm({ data: hojeISO(), mortos: '', descartados: '', causa: '', observacoes: '' });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const mortos = Number(form.mortos) || 0;
    const descartados = Number(form.descartados) || 0;

    if (validarNaoNegativo(mortos)) { setError(validarNaoNegativo(mortos)!); return; }
    if (validarNaoNegativo(descartados)) { setError(validarNaoNegativo(descartados)!); return; }
    if (mortos === 0 && descartados === 0) {
      setError('Registe pelo menos uma morte ou descarte');
      return;
    }
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }

    // Impedir registo superior ao número de aves disponíveis (vivas não vendidas)
    const disponiveis = resumo?.vivosNaoVendidos ?? 0;
    if (mortos + descartados > disponiveis) {
      setError(`Não pode registar ${mortos + descartados} aves. Existem apenas ${disponiveis} aves vivas e não vendidas neste lote.`);
      return;
    }

    const reg: RegistoMortalidade = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      mortos,
      descartados,
      causa: form.causa.trim(),
      observacoes: form.observacoes.trim(),
      createdAt: new Date().toISOString(),
    };
    await data.salvar('mortalidade', reg);
    setModalOpen(false);
    resetForm();
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Mortalidade" subtitle="Controlo diário de mortalidade e descartes" icon={<Skull size={22} />} />
        <EmptyState icon={<Skull size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar mortalidade." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mortalidade"
        subtitle="Controlo diário de mortalidade e descartes"
        icon={<Skull size={22} />}
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
          <StatCard label="Frangos Vivos" value={formatarNumero(resumo.vivosNaoVendidos, 0)} color="brand" />
          <StatCard label="Mortes Acumuladas" value={formatarNumero(resumo.totalMortos + resumo.totalDescartados, 0)} color="danger" />
          <StatCard label="Taxa de Mortalidade" value={formatarPercentagem(resumo.taxaMortalidade)} color="danger" />
          <StatCard label="Taxa de Sobrevivência" value={formatarPercentagem(resumo.taxaSobrevivencia)} color="brand" />
        </div>
      )}

      {registos.length === 0 ? (
        <EmptyState
          icon={<Skull size={40} />}
          title="Sem registos de mortalidade"
          description="Não há mortalidade registada para este lote."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-right px-4 py-3 font-semibold">Mortos</th>
                  <th className="text-right px-4 py-3 font-semibold">Descartados</th>
                  <th className="text-left px-4 py-3 font-semibold">Causa</th>
                  <th className="text-left px-4 py-3 font-semibold">Observações</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {registos.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(m.data)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600 font-semibold">{m.mortos}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-semibold">{m.descartados}</td>
                    <td className="px-4 py-3 text-neutral-600">{m.causa || '—'}</td>
                    <td className="px-4 py-3 text-neutral-500 max-w-xs truncate">{m.observacoes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="btn-secondary btn-sm text-danger hover:bg-red-50"
                        onClick={() => data.eliminar('mortalidade', m.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 font-bold text-neutral-700">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-red-600">{registos.reduce((s, m) => s + m.mortos, 0)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{registos.reduce((s, m) => s + m.descartados, 0)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Registar Mortalidade"
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Data *</label>
            <input
              type="date"
              className="input"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Frangos Mortos</label>
              <input
                type="number"
                className="input"
                value={form.mortos}
                onChange={(e) => setForm({ ...form, mortos: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="label">Descartados / Eliminados</label>
              <input
                type="number"
                className="input"
                value={form.descartados}
                onChange={(e) => setForm({ ...form, descartados: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="label">Causa Provável</label>
            <input
              className="input"
              value={form.causa}
              onChange={(e) => setForm({ ...form, causa: e.target.value })}
              placeholder="Ex: Doença respiratória, calor excessivo..."
            />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea
              className="input min-h-[60px] resize-y"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas adicionais..."
            />
          </div>
          {resumo && (
            <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
              Aves vivas (não vendidas) neste lote: <span className="font-bold text-brand-700">{resumo.vivosNaoVendidos}</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-danger bg-red-50 rounded-lg p-3">{error}</div>
          )}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={salvar}>Guardar</button>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
