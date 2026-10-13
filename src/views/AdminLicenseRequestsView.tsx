import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, FileImage, Loader2, LockKeyhole, LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RequestRow {
  id: string;
  customer_name: string;
  license_type: 'monthly' | 'yearly' | 'lifetime';
  amount_mzn: number;
  transfer_holder_name: string;
  transaction_reference: string | null;
  receipt_path: string | null;
  status: 'pending_verification' | 'approved' | 'rejected';
  created_at: string;
  review_notes: string | null;
}

const planLabels = { monthly: 'Mensal', yearly: 'Anual', lifetime: 'Vitalícia' };

export default function AdminLicenseRequestsView({ onClose }: { onClose: () => void }) {
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('license_purchase_requests').select('*').order('created_at', { ascending: false });
    if (loadError) setError('Não foi possível carregar os pedidos.');
    else setRequests((data || []) as RequestRow[]);
  }, []);

  const checkSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.app_metadata?.role === 'admin') {
      setSession({ email: data.session.user.email });
      await loadRequests();
    }
    setLoading(false);
  }, [loadRequests]);

  useEffect(() => {
    void checkSession();
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      (async () => {
        if (currentSession?.user.app_metadata?.role === 'admin') {
          setSession({ email: currentSession.user.email });
          await loadRequests();
        } else {
          setSession(null);
        }
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [checkSession, loadRequests]);

  async function signIn() {
    setError(null);
    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError || data.user?.app_metadata?.role !== 'admin') {
      if (data.user) await supabase.auth.signOut();
      setError('Credenciais administrativas inválidas.');
      return;
    }
    setSession({ email: data.user.email });
    await loadRequests();
  }

  async function reviewRequest(requestId: string, action: 'approve' | 'reject') {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    setLicenseKey(null);
    const { data, error: functionError } = await supabase.functions.invoke('manage-license-request', { body: { request_id: requestId, action } });
    setSubmitting(false);
    if (functionError || !data?.success) {
      setError('Não foi possível atualizar este pedido.');
      return;
    }
    setNotice(action === 'approve' ? 'Pedido aprovado e licença ativada.' : 'Pedido rejeitado.');
    if (data.license_key) setLicenseKey(data.license_key);
    await loadRequests();
  }

  async function openReceipt(path: string) {
    const { data, error: signedUrlError } = await supabase.storage.from('license-receipts').createSignedUrl(path, 600);
    if (signedUrlError || !data?.signedUrl) {
      setError('Não foi possível abrir o comprovativo.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div className="fixed inset-0 z-50 bg-brand-900/60 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>;

  return <div className="fixed inset-0 z-50 bg-app-surface overflow-y-auto p-4 md:p-8"><div className="max-w-6xl mx-auto"><div className="flex items-center justify-between mb-6"><div><p className="eyebrow">Área protegida</p><h1 className="text-2xl md:text-3xl font-extrabold text-brand-900">Pedidos de licenças</h1><p className="text-sm text-neutral-500 mt-1">{session ? session.email : 'Confirmação manual de pagamentos e-Mola'}</p></div><div className="flex items-center gap-2">{session && <button className="btn-secondary btn-sm" onClick={() => { void supabase.auth.signOut(); setSession(null); }}><LogOut size={15} /> Sair</button>}<button className="btn-secondary btn-sm" onClick={onClose}><X size={17} /> Fechar</button></div></div>{!session ? <div className="card max-w-md mx-auto p-6 md:p-8"><div className="h-12 w-12 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center mb-4"><LockKeyhole size={24} /></div><h2 className="text-xl font-extrabold text-brand-900">Acesso do responsável</h2><p className="text-sm text-neutral-500 mt-1 mb-5">Entre com a conta administrativa para consultar comprovativos.</p><div className="space-y-3"><div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><label className="label">Palavra-passe</label><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void signIn(); }} /></div>{error && <p className="text-sm text-danger bg-red-50 rounded-xl p-3">{error}</p>}<button className="btn-primary w-full" onClick={() => void signIn()} disabled={submitting}>{submitting ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={17} />} Entrar na área administrativa</button></div></div> : <><div className="card p-4 mb-5 bg-accent/15 border-accent"><p className="text-sm font-bold text-brand-900">Pagamento manual por e-Mola</p><p className="text-sm text-neutral-700 mt-1">Número: <strong>865831887</strong> · Titular: <strong>PEDRO ANTONIO PEDRO</strong></p><p className="text-xs text-neutral-600 mt-2">Confirme o recebimento antes de aprovar. O comprovativo, por si só, não confirma o pagamento.</p></div>{error && <p className="text-sm text-danger bg-red-50 rounded-xl p-3 mb-4">{error}</p>}{notice && <div className="text-sm text-brand-800 bg-brand-100 rounded-xl p-3 mb-4"><p>{notice}</p>{licenseKey && <p className="font-mono font-extrabold mt-1">Nova chave: {licenseKey}</p>}</div>}<div className="space-y-3">{requests.length === 0 ? <div className="card p-8 text-center text-neutral-500">Ainda não existem pedidos de licença.</div> : requests.map((request) => <RequestCard key={request.id} request={request} onReceipt={openReceipt} onReview={reviewRequest} disabled={submitting} />)}</div></>}</div></div>;
}

function RequestCard({ request, onReceipt, onReview, disabled }: { request: RequestRow; onReceipt: (path: string) => Promise<void>; onReview: (id: string, action: 'approve' | 'reject') => Promise<void>; disabled: boolean }) {
  const statusLabel = request.status === 'pending_verification' ? 'Pendente de verificação' : request.status === 'approved' ? 'Aprovado' : 'Rejeitado';
  return <article className="card p-4 md:p-5"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-brand-900">{request.customer_name}</h2><span className={`badge ${request.status === 'approved' ? 'bg-brand-100 text-brand-800' : request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{statusLabel}</span></div><div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm text-neutral-600"><p>Licença: <strong>{planLabels[request.license_type]}</strong></p><p>Valor: <strong>{request.amount_mzn.toLocaleString('pt-MZ')} MZN</strong></p><p>Titular: <strong>{request.transfer_holder_name}</strong></p><p>Data: <strong>{new Date(request.created_at).toLocaleString('pt-MZ')}</strong></p><p>Referência: <strong>{request.transaction_reference || 'Não indicada'}</strong></p></div></div><div className="flex flex-wrap gap-2">{request.receipt_path && <button className="btn-secondary btn-sm" onClick={() => void onReceipt(request.receipt_path!)}><FileImage size={15} /> Ver comprovativo <ExternalLink size={13} /></button>}{request.status === 'pending_verification' && <><button className="btn-primary btn-sm" onClick={() => void onReview(request.id, 'approve')} disabled={disabled}><Check size={15} /> Aprovar e ativar</button><button className="btn-secondary btn-sm text-danger" onClick={() => void onReview(request.id, 'reject')} disabled={disabled}><X size={15} /> Rejeitar</button></>}</div></div></article>;
}
