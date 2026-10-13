import { useCallback, useEffect, useState } from 'react';
import * as db from '../db';
import type {
  Lote,
  RegistoMortalidade,
  RegistoRacao,
  RegistoPesagem,
  RegistoAgua,
  RegistoSaude,
  Lembrete,
  RegistoDespesa,
  RegistoVenda,
  MetaCrescimento,
  StoreName,
} from '../types';

export interface AppData {
  lotes: Lote[];
  mortalidade: RegistoMortalidade[];
  racao: RegistoRacao[];
  pesagens: RegistoPesagem[];
  agua: RegistoAgua[];
  saude: RegistoSaude[];
  lembretes: Lembrete[];
  despesas: RegistoDespesa[];
  vendas: RegistoVenda[];
  metas: MetaCrescimento[];
  loading: boolean;
  salvar: <T extends { id: string }>(store: StoreName, reg: T) => Promise<void>;
  eliminar: (store: StoreName, id: string) => Promise<void>;
  recarregar: () => Promise<void>;
}

export function useAppData(): AppData {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [mortalidade, setMortalidade] = useState<RegistoMortalidade[]>([]);
  const [racao, setRacao] = useState<RegistoRacao[]>([]);
  const [pesagens, setPesagens] = useState<RegistoPesagem[]>([]);
  const [agua, setAgua] = useState<RegistoAgua[]>([]);
  const [saude, setSaude] = useState<RegistoSaude[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [despesas, setDespesas] = useState<RegistoDespesa[]>([]);
  const [vendas, setVendas] = useState<RegistoVenda[]>([]);
  const [metas, setMetas] = useState<MetaCrescimento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const [
      l,
      m,
      r,
      p,
      a,
      s,
      lem,
      d,
      v,
      met,
    ] = await Promise.all([
      db.getAll<Lote>('lotes'),
      db.getAll<RegistoMortalidade>('mortalidade'),
      db.getAll<RegistoRacao>('racao'),
      db.getAll<RegistoPesagem>('pesagens'),
      db.getAll<RegistoAgua>('agua'),
      db.getAll<RegistoSaude>('saude'),
      db.getAll<Lembrete>('lembretes'),
      db.getAll<RegistoDespesa>('despesas'),
      db.getAll<RegistoVenda>('vendas'),
      db.getAll<MetaCrescimento>('metas'),
    ]);
    setLotes(l.sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
    setMortalidade(m);
    setRacao(r);
    setPesagens(p);
    setAgua(a);
    setSaude(s);
    setLembretes(lem);
    setDespesas(d);
    setVendas(v);
    setMetas(met);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvar = useCallback(
    async <T extends { id: string }>(store: StoreName, reg: T) => {
      await db.put(store, reg);
      await carregar();
    },
    [carregar]
  );

  const eliminar = useCallback(
    async (store: StoreName, id: string) => {
      await db.remove(store, id);
      await carregar();
    },
    [carregar]
  );

  return {
    lotes,
    mortalidade,
    racao,
    pesagens,
    agua,
    saude,
    lembretes,
    despesas,
    vendas,
    metas,
    loading,
    salvar,
    eliminar,
    recarregar: carregar,
  };
}
