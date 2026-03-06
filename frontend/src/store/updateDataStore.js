import { create } from "zustand";

const updateDataStore = create((set) => ({
  accounts: [],
  loading: false,
  error: null,

  setAccounts: (accounts) => set({ accounts }),

  uploadBulkAccounts: async (accounts) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/accounts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accounts),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || "Upload failed";
        set({ error: msg, loading: false });
        return;
      }
      set({ accounts: data, loading: false });
    } catch (err) {
      set({ error: "Failed to upload accounts", loading: false });
    }
  },
}));

export default updateDataStore;
