'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../../lib/db';
import { sqlite } from '../../lib/sqlite-client';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function SyncService() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || (branches && branches[0]);
    const isOnline = useNetworkStatus();
    const [isSyncingMaster, setIsSyncingMaster] = useState(false);
    const [isSyncingPending, setIsSyncingPending] = useState(false);
    
    // Ref to prevent redundant master syncs
    const lastMasterSyncRef = useRef({ time: 0, branchId: null });

    const syncPendingTransactions = useCallback(async () => {
        if (!isOnline || !currentBranch || isSyncingPending) return;

        try {
            setIsSyncingPending(true);
            const pendingParams = await sqlite.getPendingTransactions();

            if (pendingParams.length === 0) {
                setIsSyncingPending(false);
                return;
            }
            
            window.dispatchEvent(new CustomEvent('sync:start', { detail: { count: pendingParams.length } }));
            console.log(`[SyncService] Syncing ${pendingParams.length} pending transactions...`);

            for (const item of pendingParams) {
                const { No_Transaksi, ...cleanPayload } = item.payload;
                
                const res = await fetch(`/api/transactions/add?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanPayload),
                });

                if (res.ok) {
                    await sqlite.markSynced(item.No_Transaksi);
                }
            }
            
            window.dispatchEvent(new CustomEvent('sync:end', { detail: { success: true } }));
        } catch (error) {
            console.error('[SyncService] Failed to sync transactions', error);
            window.dispatchEvent(new CustomEvent('sync:end', { detail: { success: false, error: error.message } }));
        } finally {
            setIsSyncingPending(false);
        }
    }, [isOnline, currentBranch, isSyncingPending]);

    const syncMasterData = useCallback(async (force = false) => {
        if (!isOnline || !currentBranch || isSyncingMaster) return;

        const branchId = currentBranch.uniqueId;
        const now = Date.now();
        const ONE_HOUR = 3600000;

        // Skip if recently synced for this branch, unless forced
        if (!force && 
            lastMasterSyncRef.current.branchId === branchId && 
            (now - lastMasterSyncRef.current.time < ONE_HOUR)) {
            return;
        }

        try {
            setIsSyncingMaster(true);
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: branchId,
                paginate: 2000
            });

            console.log(`[SyncService] Syncing master items for ${currentBranch.storeName}...`);
            const prodRes = await fetch(`/api/products/getAll?${params.toString()}`);
            const prodData = await prodRes.json();
            
            if (prodData.success && prodData.data?.data) {
                await sqlite.upsertItems(prodData.data.data);
                
                // Mirror to Dexie for legacy fallback
                await db.master_items.clear();
                await db.master_items.bulkAdd(prodData.data.data);
                
                lastMasterSyncRef.current = { time: Date.now(), branchId };
                console.log('[SyncService] Master items synced successfully');
            }
        } catch (err) {
            console.error('[SyncService] Failed to sync master data', err);
        } finally {
            setIsSyncingMaster(false);
        }
    }, [isOnline, currentBranch, isSyncingMaster]);

    useEffect(() => {
        if (isOnline && currentBranch) {
            syncMasterData();
            syncPendingTransactions();
        }

        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncPendingTransactions();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [isOnline, currentBranch?.uniqueId, syncMasterData, syncPendingTransactions]);

    return null;
}
