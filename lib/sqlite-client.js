// Utility to call SQLite from the renderer process
// Since contextIsolation is false and nodeIntegration is true, we can use require('electron')
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

let ipcRenderer;
if (isElectron) {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
}

export const sqlite = {
    // Items
    upsertItems: async (items) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('db:items:upsert', items);
    },
    searchItems: async (query) => {
        if (!ipcRenderer) return [];
        return await ipcRenderer.invoke('db:items:search', query);
    },

    // Transactions
    saveTransaction: async (data) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('db:transactions:save', data);
    },
    getPendingTransactions: async () => {
        if (!ipcRenderer) return [];
        return await ipcRenderer.invoke('db:transactions:getPending');
    },
    markSynced: async (No_Transaksi) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('db:transactions:markSynced', No_Transaksi);
    }
};
