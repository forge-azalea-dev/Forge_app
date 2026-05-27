import { useState, useEffect, useCallback } from "react";
import { BillingRepo } from "@/lib/database";
import type { Billing, CreateBilling, UpdateBilling } from "@/lib/database";
import type { BillingStatus } from "@/lib/database";

interface UseBillingReturn {
  billings: Billing[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: BillingStatus | "all";
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: BillingStatus | "all") => void;
  createBilling: (data: CreateBilling) => Promise<void>;
  updateBilling: (id: string, data: UpdateBilling) => Promise<void>;
  deleteBilling: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useBilling(): UseBillingReturn {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">("all");

  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Billing[];
      if (searchQuery.trim()) {
        data = await BillingRepo.search(searchQuery.trim());
      } else if (statusFilter !== "all") {
        data = await BillingRepo.filterByStatus(statusFilter);
      } else {
        data = await BillingRepo.getAll();
      }

      setBillings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data billing");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const createBilling = async (data: CreateBilling): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.create(data);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat billing");
      throw err;
    }
  };

  const updateBilling = async (id: string, data: UpdateBilling): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.update(id, data);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update billing");
      throw err;
    }
  };

  const deleteBilling = async (id: string): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.delete(id);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus billing");
      throw err;
    }
  };

  return {
    billings,
    loading,
    error,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    createBilling,
    updateBilling,
    deleteBilling,
    refetch: fetchBillings,
  };
}
