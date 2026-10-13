import { useMemo, useState } from 'react';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { RegistoVenda } from '../types';
import {
  calcularResumoLote,
  formatarData,
  formatarMZN,
  formatarNumero,
  hojeISO,
  sortPorData,
  validarPositivo,
  validarDataRegisto,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import LoteSelector from '../components/LoteSelector';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface VendasViewProps {
  data: AppData;
}

export default function VendasView({ data }: VendasViewProps) {
  const [loteId, setLoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    data: hojeISO(),
    numeroAves: '',
    pesoTotal: '',
    precoPorKg: '',
    precoPorAve: '',
    comprador: '',
    observacoes: '',
    vendaTotal: false,
  });
  const [error, setError] = useState<string | null>(null);

  const lotes = data.lotes;
  const selectedId = loteId || lotes[0]?.id || null;
  const lote = lotes.find((l) => l.id === selectedId);
  const resumo = useMemo(
    () => (lote ? calcularResumoLote(lote, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas) : null),
    [lote, data]
  );

  const vendas = useMemo(
    () => sortPorData(data.vendas.filter((v) => v.loteId === selectedId)),
    [data.vendas, selectedId]
  );

  const totalReceitas = vendas.reduce((s, v) => s + v.valorTotal, 0);
  const totalAvesVendidas = vendas.reduce((s, v) => s + v.numeroAves, 0);
  const totalPesoVendido = vendas.reduce((s, v) => s + v.pesoTotal, 0);

  // Valor total calculado
  const valorCalculado = useMemo(() => {
    const ppkg = Number(form.precoPorKg) || 0;
    const ppave = Number(form.precoPorAve) || 0;
    const pt = Number(form.pesoTotal) || 0;
    const na = Number(form.numeroAves) || 0;
    if (ppkg > 0 && pt > 0) return ppkg * pt;
    if (ppave > 0 && na > 0) return ppave * na;
    return 0;
  }, [form]);

  function resetForm() {
    setForm({ data: hojeISO(), numeroAves: '', pesoTotal: '', precoPorKg: '', precoPorAve: '', comprador: '', observacoes: '', vendaTotal: false });
    setError(null);
  }

  async function salvar() {
    if (!selectedId) return;
    const na = Number(form.numeroAves);
    const pt = Number(form.pesoTotal);
    if (validarPositivo(na)) { setError('Número de aves inválido'); return; }

    // Verificar se não excede aves disponíveis (vivas não vendidas)
    const disponiveisParaVenda = resumo?.vivosNaoVendidos ?? 0;
    if (na > disponiveisParaVenda) {
      setError(`Só existem ${disponiveisParaVenda} aves disponíveis para venda neste lote.`);
      return;
    }

    const valorTotal = valorCalculado;
    if (valorTotal <= 0) { setError('Indique preço por kg ou por ave para calcular o valor total'); return; }
    if (lote) {
      const errData = validarDataRegisto(form.data, lote.dataChegada);
      if (errData) { setError(errData); return; }
    }

    const reg: RegistoVenda = {
      id: generateId(),
      loteId: selectedId,
      data: form.data,
      numeroAves: na,
      pesoTotal: pt,
      precoPorKg: form.precoPorKg ? Number(form.precoPorKg) : null,
      precoPorAve: form.precoPorAve ? Number(form.precoPorAve) : null,
      valorTotal,
      comprador: form.comprador.trim(),
      observacoes: form.observacoes.trim(),
      createdAt: new Date().toISOString(),
    };
    await data.salvar('vendas', reg);
    setModalOpen(false);
    resetForm();
  }

  if (data.lotes.length === 0) {
    return (
      <div>
        <PageHeader title="Vendas e Receitas" subtitle="Registo de vendas de frangos" icon={<ShoppingCart size={22} />} />
        <EmptyState icon={<ShoppingCart size={48} />} title="Sem lotes" description="Crie um lote primeiro para registar vendas." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vendas e Receitas"
        subtitle="Registo de vendas de frangos"
        icon={<ShoppingCart size={22} />}
        action={
          <button className="btn-primary" disabled={!selectedId} onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus size={18} /> Registar Venda
          </button>
        }
      />

      <div className="mb-4">
        <LoteSelector lotes={data.lotes} loteId={selectedId} onChange={setLoteId} />
      </div>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Receita Total" value={formatarMZN(totalReceitas)} color="info" />
          <StatCard label="Aves Vendidas" value={formatarNumero(totalAvesVendidas, 0)} />
          <StatCard label="Peso Vendido" value={`${formatarNumero(totalPesoVendido, 0)} kg`} />
          <StatCard
            label="Aves Disponíveis"
            value={formatarNumero(resumo.vivosNaoVendidos, 0)}
            color="brand"
          />
        </div>
      )}

      {vendas.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={40} />} title="Sem vendas" description="Registe vendas parciais ou a venda total do lote." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-right px-4 py-3 font-semibold">Aves</th>
                  <th className="text-right px-4 py-3 font-semibold">Peso (kg)</th>
                  <th className="text-right px-4 py-3 font-semibold">Preço/kg</th>
                  <th className="text-right px-4 py-3 font-semibold">Preço/ave</th>
                  <th className="text-left px-4 py-3 font-semibold">Comprador</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {vendas.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-700">{formatarData(v.data)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{v.numeroAves}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatarNumero(v.pesoTotal, 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{v.precoPorKg != null ? formatarMZN(v.precoPorKg) : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{v.precoPorAve != null ? formatarMZN(v.precoPorAve) : '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{v.comprador || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-brand-700">{formatarMZN(v.valorTotal)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary btn-sm text-danger hover:bg-red-50" onClick={() => data.eliminar('vendas', v.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 font-bold text-neutral-700">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{totalAvesVendidas}</td>
                  <td className="px-4 py-3 text-right">{formatarNumero(totalPesoVendido, 0)}</td>
                  <td colSpan={3}></td>
                  <td className="px-4 py-3 text-right text-brand-700">{formatarMZN(totalReceitas)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} title="Registar Venda" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Data da Venda *</label>
            <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Número de Frangos Vendidos *</label>
              <input type="number" className="input" value={form.numeroAves} onChange={(e) => setForm({ ...form, numeroAves: e.target.value })} placeholder="Ex: 100" min="1" />
            </div>
            <div>
              <label className="label">Peso Total Vendido (kg)</label>
              <input type="number" step="0.1" className="input" value={form.pesoTotal} onChange={(e) => setForm({ ...form, pesoTotal: e.target.value })} placeholder="Ex: 250" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Preço por kg (MT)</label>
              <input type="number" step="0.01" className="input" value={form.precoPorKg} onChange={(e) => setForm({ ...form, precoPorKg: e.target.value })} placeholder="0.00" min="0" />
            </div>
            <div>
              <label className="label">Preço por Ave (MT)</label>
              <input type="number" step="0.01" className="input" value={form.precoPorAve} onChange={(e) => setForm({ ...form, precoPorAve: e.target.value })} placeholder="0.00" min="0" />
            </div>
          </div>
          <div>
            <label className="label">Comprador</label>
            <input className="input" value={form.comprador} onChange={(e) => setForm({ ...form, comprador: e.target.value })} placeholder="Ex: Supermercado Lda" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[60px] resize-y" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas adicionais..." />
          </div>
          {valorCalculado > 0 && (
            <div className="text-sm bg-brand-50 text-brand-800 rounded-lg p-3">
              <span className="font-semibold">Valor total da venda: </span>
              {formatarMZN(valorCalculado)}
            </div>
          )}
          {resumo && (
            <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
              Aves disponíveis para venda: <span className="font-bold text-brand-700">{resumo.vivosNaoVendidos}</span>
            </div>
          )}
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
