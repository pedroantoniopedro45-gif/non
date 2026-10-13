import type { Lote } from '../types';
import { idadeDias, idadeSemanas } from '../utils/calculos';

interface LoteSelectorProps {
  lotes: Lote[];
  loteId: string | null;
  onChange: (id: string) => void;
  onlyAtivos?: boolean;
}

export default function LoteSelector({
  lotes,
  loteId,
  onChange,
  onlyAtivos,
}: LoteSelectorProps) {
  const filtrados = onlyAtivos
    ? lotes.filter((l) => l.estado === 'ativo')
    : lotes;

  if (filtrados.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-neutral-500">
        Nenhum lote disponível. Crie um lote primeiro na secção "Lotes".
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <label className="label sm:w-24 sm:mb-0">Lote</label>
      <select
        className="input flex-1"
        value={loteId || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Selecionar lote...
        </option>
        {filtrados.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome} — {l.linhagem} ({idadeDias(l.dataChegada)}d /{' '}
            {idadeSemanas(l.dataChegada)}sem)
          </option>
        ))}
      </select>
    </div>
  );
}
