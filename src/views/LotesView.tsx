import { useMemo, useState } from 'react';
import { Package, Plus, Pencil, Trash2, Bird, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import type { AppData } from '../hooks/useAppData';
import type { Lote, Linhagem, EstadoLote } from '../types';
import {
  calcularResumoLote,
  formatarData,
  formatarMZN,
  formatarNumero,
  formatarPercentagem,
  hojeISO,
  validarPositivo,
  validarNaoNegativo,
} from '../utils/calculos';
import { generateId } from '../db';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const LINHAGENS: Linhagem[] = ['Ross', 'Cobb', 'Hubbard', 'Cobb-Vantress', 'Outra'];
const ESTADOS: { value: EstadoLote; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'encerrado', label: 'Encerrado' },
];

interface LotesViewProps {
  data: AppData;
}

const EMPTY_FORM = {
  nome: '',
  dataChegada: hojeISO(),
  quantidadeInicial: '',
  linhagem: 'Ross' as Linhagem,
  fornecedor: '',
  precoPorPinto: '',
  custoAquisicao: '',
  origem: '',
  observacoes: '',
  estado: 'ativo' as EstadoLote,
  dataEncerramento: '',
};

export default function LotesView({ data }: LotesViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detailId, setDetailId] = useState<string | null>(null);

  const resumos = useMemo(
    () =>
      data.lotes.map((l) =>
        calcularResumoLote(l, data.mortalidade, data.racao, data.pesagens, data.despesas, data.vendas)
      ),
    [data]
  );

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(lote: Lote) {
    setForm({
      nome: lote.nome,
      dataChegada: lote.dataChegada,
      quantidadeInicial: String(lote.quantidadeInicial),
      linhagem: lote.linhagem,
      fornecedor: lote.fornecedor,
      precoPorPinto: String(lote.precoPorPinto),
      custoAquisicao: String(lote.custoAquisicao),
      origem: lote.origem,
      observacoes: lote.observacoes,
      estado: lote.estado,
      dataEncerramento: lote.dataEncerramento || '',
    });
    setEditingId(lote.id);
    setErrors({});
    setModalOpen(true);
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.dataChegada) e.dataChegada = 'Obrigatório';
    const qi = Number(form.quantidadeInicial);
    if (validarPositivo(qi)) e.quantidadeInicial = validarPositivo(qi)!;
    const pp = Number(form.precoPorPinto);
    if (validarNaoNegativo(pp)) e.precoPorPinto = validarNaoNegativo(pp)!;
    const ca = Number(form.custoAquisicao);
    if (validarNaoNegativo(ca)) e.custoAquisicao = validarNaoNegativo(ca)!;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function autoCalcCusto(val: string, field: 'precoPorPinto' | 'quantidadeInicial' | 'custoAquisicao') {
    const next = { ...form, [field]: val };
    const qi = Number(next.quantidadeInicial);
    const pp = Number(next.precoPorPinto);
    if (qi > 0 && pp >= 0 && (field === 'precoPorPinto' || field === 'quantidadeInicial')) {
      next.custoAquisicao = String((qi * pp).toFixed(2));
    }
    setForm(next);
  }

  async function salvar() {
    if (!validar()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const lote: Lote = {
        id: editingId || generateId(),
        nome: form.nome.trim(),
        dataChegada: form.dataChegada,
        quantidadeInicial: Number(form.quantidadeInicial),
        linhagem: form.linhagem,
        fornecedor: form.fornecedor.trim(),
        precoPorPinto: Number(form.precoPorPinto),
        custoAquisicao: Number(form.custoAquisicao),
        origem: form.origem.trim(),
        observacoes: form.observacoes.trim(),
        estado: form.estado,
        dataEncerramento: form.estado === 'ativo' ? null : (form.dataEncerramento || hojeISO()),
        createdAt: editingId
          ? data.lotes.find((l) => l.id === editingId)?.createdAt || now
          : now,
        updatedAt: now,
      };
      await data.salvar('lotes', lote);
      setModalOpen(false);
      setToast(editingId ? 'Lote atualizado com sucesso!' : 'Lote criado com sucesso!');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setSaveError('Erro ao guardar o lote. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function eliminarLote(id: string) {
    if (!confirm('Confirma a eliminação deste lote? Todos os registos associados serão mantidos mas ficarão sem lote associado.')) return;
    await data.eliminar('lotes', id);
    if (detailId === id) setDetailId(null);
  }

  if (data.lotes.length === 0 && !modalOpen) {
    return (
      <div>
        <PageHeader
          title="Lotes"
          subtitle="Gestão de lotes de frangos de corte"
          icon={<Package size={22} />}
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus size={18} /> Novo Lote
            </button>
          }
        />
        <EmptyState
          icon={<Package size={48} />}
          title="Nenhum lote registado"
          description="Crie o seu primeiro lote de frangos de corte para começar a registar dados de produção."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus size={18} /> Criar Lote
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Lotes"
        subtitle="Gestão de lotes de frangos de corte"
        icon={<Package size={22} />}
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus size={18} /> Novo Lote
          </button>
        }
      />

      <div className="space-y-3">
        {resumos.map((r) => (
          <div key={r.lote.id} className="card p-4">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              onClick={() => setDetailId(detailId === r.lote.id ? null : r.lote.id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-50 p-2 rounded-lg text-brand-700">
                  <Bird size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-neutral-800">{r.lote.nome}</h4>
                    <span
                      className={`badge ${
                        r.lote.estado === 'ativo'
                          ? 'bg-brand-100 text-brand-700'
                          : r.lote.estado === 'vendido'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {r.lote.estado}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {r.lote.linhagem} · Chegada: {formatarData(r.lote.dataChegada)} · {r.lote.quantidadeInicial} pintos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="text-neutral-500 text-xs">Idade</div>
                  <div className="font-semibold text-neutral-700">
                    {r.idadeDias} dias · {r.idadeSemanas} sem
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-neutral-500 text-xs">Vivos</div>
                  <div className="font-semibold text-brand-700">{formatarNumero(r.vivosNaoVendidos, 0)}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(r.lote); }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-secondary btn-sm text-danger hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); eliminarLote(r.lote.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Detalhe expandido */}
            {detailId === r.lote.id && (
              <div className="mt-4 pt-4 border-t border-neutral-200 fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <StatCard label="Mortalidade" value={formatarPercentagem(r.taxaMortalidade)} color="danger" />
                  <StatCard label="Sobrevivência" value={formatarPercentagem(r.taxaSobrevivencia)} color="brand" />
                  <StatCard label="Peso Médio" value={r.pesoMedioAtual != null ? `${formatarNumero(r.pesoMedioAtual, 3)} kg` : '—'} />
                  <StatCard label="Ração Stock" value={`${formatarNumero(r.stockRacao, 0)} kg`} color="warning" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <StatCard label="Despesas" value={formatarMZN(r.totalDespesas)} color="neutral" />
                  <StatCard label="Receitas" value={formatarMZN(r.totalReceitas)} color="info" />
                  <StatCard
                    label="Lucro/Prejuízo"
                    value={r.lucro != null ? formatarMZN(r.lucro) : '—'}
                    color={r.lucro != null && r.lucro >= 0 ? 'brand' : 'danger'}
                  />
                  <StatCard label="Aves Vendidas" value={formatarNumero(r.totalAvesVendidas, 0)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <InfoLine label="Fornecedor" value={r.lote.fornecedor || '—'} />
                    <InfoLine label="Origem" value={r.lote.origem || '—'} />
                    <InfoLine label="Preço por pinto" value={formatarMZN(r.lote.precoPorPinto)} />
                    <InfoLine label="Custo de aquisição" value={formatarMZN(r.lote.custoAquisicao)} />
                  </div>
                  <div className="space-y-1">
                    <InfoLine label="Ração comprada" value={`${formatarNumero(r.racaoCompradaTotal, 0)} kg`} />
                    <InfoLine label="Ração consumida" value={`${formatarNumero(r.racaoConsumidaTotal, 0)} kg`} />
                    <InfoLine label="Conversão alimentar" value={r.conversaoAlimentar != null ? formatarNumero(r.conversaoAlimentar, 2) : '—'} />
                    <InfoLine label="Ganho médio diário" value={r.ganhoMedioDiario != null ? `${formatarNumero(r.ganhoMedioDiario, 0)} g/dia` : '—'} />
                    <InfoLine label="Custo ração consumida" value={formatarMZN(r.custoRacaoConsumida)} />
                    <InfoLine label="Fluxo de caixa" value={r.fluxoCaixa != null ? formatarMZN(r.fluxoCaixa) : '—'} />
                  </div>
                </div>
                {r.lote.observacoes && (
                  <div className="mt-3 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                    <span className="font-semibold">Observações: </span>
                    {r.lote.observacoes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editingId ? 'Editar Lote' : 'Novo Lote'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nome / Código do Lote *</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Lote 001"
            />
            {errors.nome && <p className="text-xs text-danger mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="label">Data de Chegada *</label>
            <input
              type="date"
              className="input"
              value={form.dataChegada}
              onChange={(e) => setForm({ ...form, dataChegada: e.target.value })}
            />
            {errors.dataChegada && <p className="text-xs text-danger mt-1">{errors.dataChegada}</p>}
          </div>

          <div>
            <label className="label">Quantidade Inicial de Pintos *</label>
            <input
              type="number"
              className="input"
              value={form.quantidadeInicial}
              onChange={(e) => autoCalcCusto(e.target.value, 'quantidadeInicial')}
              placeholder="Ex: 500"
              min="0"
            />
            {errors.quantidadeInicial && <p className="text-xs text-danger mt-1">{errors.quantidadeInicial}</p>}
          </div>

          <div>
            <label className="label">Linhagem</label>
            <select
              className="input"
              value={form.linhagem}
              onChange={(e) => setForm({ ...form, linhagem: e.target.value as Linhagem })}
            >
              {LINHAGENS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Estado</label>
            <select
              className="input"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoLote })}
            >
              {ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Fornecedor</label>
            <input
              className="input"
              value={form.fornecedor}
              onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              placeholder="Ex: Avícola Lda"
            />
          </div>

          <div>
            <label className="label">Origem dos Pintos</label>
            <input
              className="input"
              value={form.origem}
              onChange={(e) => setForm({ ...form, origem: e.target.value })}
              placeholder="Ex: Matola"
            />
          </div>

          <div>
            <label className="label">Preço por Pinto (MT)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.precoPorPinto}
              onChange={(e) => autoCalcCusto(e.target.value, 'precoPorPinto')}
              placeholder="Ex: 35.00"
              min="0"
            />
            {errors.precoPorPinto && <p className="text-xs text-danger mt-1">{errors.precoPorPinto}</p>}
          </div>

          <div>
            <label className="label">Custo Total de Aquisição (MT)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.custoAquisicao}
              onChange={(e) => setForm({ ...form, custoAquisicao: e.target.value })}
              placeholder="Ex: 17500.00"
              min="0"
            />
            {errors.custoAquisicao && <p className="text-xs text-danger mt-1">{errors.custoAquisicao}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="label">Data de Encerramento {form.estado !== 'ativo' ? '*' : '(opcional)'}</label>
            <input
              type="date"
              className="input"
              value={form.dataEncerramento}
              onChange={(e) => setForm({ ...form, dataEncerramento: e.target.value })}
              disabled={form.estado === 'ativo'}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Observações</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas adicionais sobre o lote..."
            />
          </div>
        </div>

        {saveError && (
          <div className="mt-4 text-sm text-danger bg-red-50 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            {saveError}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={salvar} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                A guardar...
              </>
            ) : editingId ? (
              'Guardar Alterações'
            ) : (
              'Criar Lote'
            )}
          </button>
          <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancelar
          </button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-600 text-white px-4 py-3 rounded-lg shadow-lg fade-in flex items-center gap-2">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-500">{label}:</span>
      <span className="font-semibold text-neutral-700 text-right">{value}</span>
    </div>
  );
}
