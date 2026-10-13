import { useState, type ChangeEvent } from 'react';
import { CheckCircle2, ImagePlus, Loader2, MessageCircle, X } from 'lucide-react';
import type { LicensePlan } from '../types';
import { useLicensePurchases } from '../hooks/useLicensePurchases';

interface LicensePurchaseModalProps {
  plan: LicensePlan;
  onClose: () => void;
}

const planInfo: Record<LicensePlan, { name: string; amount: number; validity: string }> = {
  monthly: { name: 'Licença Mensal', amount: 150, validity: '30 dias' },
  yearly: { name: 'Licença Anual', amount: 250, validity: '365 dias' },
  lifetime: { name: 'Licença Vitalícia', amount: 1500, validity: 'permanente' },
};

export default function LicensePurchaseModal({ plan, onClose }: LicensePurchaseModalProps) {
  const selected = planInfo[plan];
  const { submitRequest, saving } = useLicensePurchases();
  const [customerName, setCustomerName] = useState('');
  const [transferHolderName, setTransferHolderName] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'synced' | 'offline' | null>(null);

  function handleReceipt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Envie uma imagem JPG, PNG ou WebP com no máximo 5 MB.');
      return;
    }
    setError(null);
    setReceipt(file);
  }

  async function submit() {
    setError(null);
    if (!customerName.trim() || !transferHolderName.trim() || !receipt) {
      setError('Preencha o nome do cliente, o titular da transferência e anexe o comprovativo.');
      return;
    }
    try {
      const syncStatus = await submitRequest({ customerName, licenseType: plan, amountMzn: selected.amount, transferHolderName, transactionReference, receipt });
      setResult(syncStatus);
    } catch {
      setError('Não foi possível registar o pedido. O formulário pode ser tentado novamente.');
    }
  }

  return <div className="fixed inset-0 z-50 bg-brand-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="bg-app-surface rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-neutral-200"><div><p className="eyebrow">Pedido de licença</p><h2 className="text-2xl font-extrabold text-brand-900 mt-1">{selected.name}</h2><p className="text-sm text-neutral-500 mt-1">{selected.amount.toLocaleString('pt-MZ')} MZN · {selected.validity}</p></div><button className="btn-secondary btn-sm" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>{result ? <div className="p-6 md:p-8 text-center"><div className="h-16 w-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div><h3 className="text-xl font-extrabold text-brand-900">Pedido registado</h3><p className="text-sm text-neutral-600 leading-6 mt-3">O pedido está <strong>pendente de verificação</strong>. O responsável irá confirmar manualmente o recebimento do e-Mola antes de aprovar e ativar a licença.</p>{result === 'offline' && <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3 mt-4">Está offline. O pedido foi guardado neste dispositivo e será enviado quando houver internet.</p>}<a className="btn-secondary mt-5" href={`https://wa.me/258865831887?text=${encodeURIComponent('Enviei um pedido de licença do AVICONTROL PRO e aguardo verificação.')}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Contactar responsável</a><button className="btn-primary mt-3 w-full" onClick={onClose}>Concluir</button></div> : <div className="p-5 md:p-6 space-y-5"><div className="rounded-2xl bg-accent/20 border border-accent/60 p-4"><p className="text-sm font-extrabold text-brand-900">Pagamento por transferência e-Mola</p><p className="text-sm text-neutral-700 mt-2">Número: <strong>865831887</strong></p><p className="text-sm text-neutral-700">Titular: <strong>PEDRO ANTONIO PEDRO</strong></p><p className="text-xs text-neutral-600 mt-3">Transfira exatamente {selected.amount.toLocaleString('pt-MZ')} MZN, guarde o comprovativo e preencha os dados abaixo.</p></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Nome do cliente *</label><input className="input" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome completo" /></div><div><label className="label">Titular da transferência *</label><input className="input" value={transferHolderName} onChange={(event) => setTransferHolderName(event.target.value)} placeholder="Nome no e-Mola" /></div></div><div><label className="label">Referência da transação</label><input className="input" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Opcional" /></div><div><label className="label">Fotografia do comprovativo *</label><label className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-4 cursor-pointer hover:bg-brand-100 transition-colors"><ImagePlus size={24} className="text-brand-700" /><span className="text-sm font-bold text-brand-900">{receipt ? receipt.name : 'Escolher imagem do comprovativo'}<span className="block text-xs font-normal text-neutral-500 mt-1">JPG, PNG ou WebP · máximo 5 MB</span></span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleReceipt} /></label></div>{error && <p className="text-sm text-danger bg-red-50 rounded-xl p-3">{error}</p>}<p className="text-xs text-neutral-500">O envio da imagem não confirma o pagamento. O responsável verifica o comprovativo manualmente.</p><button className="btn-primary w-full" onClick={() => void submit()} disabled={saving}>{saving ? <><Loader2 size={18} className="animate-spin" /> A registar pedido...</> : 'Registar pedido pendente'}</button></div>}</div></div>;
}
