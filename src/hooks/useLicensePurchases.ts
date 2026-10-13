import { useCallback, useEffect, useState } from 'react';
import * as db from '../db';
import type { LicensePlan, LicensePurchaseRequest } from '../types';
import { supabase } from '../lib/supabase';

const REQUEST_STORE = 'pedidosLicenca' as const;

export interface NewLicenseRequest {
  customerName: string;
  licenseType: LicensePlan;
  amountMzn: number;
  transferHolderName: string;
  transactionReference: string;
  receipt: File | null;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] || 'application/octet-stream';
  const bytes = atob(data);
  const array = Uint8Array.from(bytes, (char) => char.charCodeAt(0));
  return new Blob([array], { type: mime });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function syncRequest(request: LicensePurchaseRequest): Promise<void> {
  let receiptPath: string | null = null;
  if (request.receiptDataUrl) {
    const extension = request.receiptName.split('.').pop()?.toLowerCase() || 'jpg';
    receiptPath = `pending/${request.id}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('license-receipts')
      .upload(receiptPath, dataUrlToBlob(request.receiptDataUrl), { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, upsert: false });
    if (uploadError && uploadError.message !== 'The resource already exists') throw uploadError;
  }

  const { error } = await supabase.from('license_purchase_requests').insert({
    customer_name: request.customerName,
    license_type: request.licenseType,
    amount_mzn: request.amountMzn,
    transfer_holder_name: request.transferHolderName,
    transaction_reference: request.transactionReference || null,
    receipt_path: receiptPath,
  });
  if (error && !error.message.toLowerCase().includes('duplicate')) throw error;
}

async function markSynced(request: LicensePurchaseRequest): Promise<void> {
  await db.put(REQUEST_STORE, { ...request, syncStatus: 'synced' });
}

export function useLicensePurchases() {
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      const requests = await db.getAll<LicensePurchaseRequest>(REQUEST_STORE);
      for (const request of requests.filter((item) => item.syncStatus === 'pending')) {
        try {
          await syncRequest(request);
          await markSynced(request);
        } catch {
          break;
        }
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void syncPending();
    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
  }, [syncPending]);

  const submitRequest = useCallback(async (input: NewLicenseRequest): Promise<'synced' | 'offline'> => {
    setSaving(true);
    const receiptDataUrl = input.receipt ? await fileToDataUrl(input.receipt) : null;
    const request: LicensePurchaseRequest = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      licenseType: input.licenseType,
      amountMzn: input.amountMzn,
      paymentMethod: 'e-mola',
      paymentNumber: '865831887',
      transferHolderName: input.transferHolderName.trim(),
      transactionReference: input.transactionReference.trim(),
      receiptName: input.receipt?.name || '',
      receiptDataUrl,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    try {
      await db.put(REQUEST_STORE, request);
      if (navigator.onLine) {
        await syncRequest(request);
        await markSynced(request);
        return 'synced';
      }
      return 'offline';
    } finally {
      setSaving(false);
    }
  }, []);

  return { submitRequest, syncPending, saving, syncing };
}
