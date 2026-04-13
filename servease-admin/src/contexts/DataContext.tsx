import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import {
  ServiceCategory,
  ServiceProvider,
  Customer,
  Booking,
  Transaction,
  PayoutRequest,
  Dispute,
  Refund,
  AdminUser,
  AuditLog,
  DashboardStats,
  ProviderEarning,
} from "../types";
import * as dataStore from "../services/dataStore";
import { useAuth } from "../app/contexts/AuthContext";
import {
  getAdminActivityLog,
  getBookingHistory,
  getCustomers,
  getDisputes,
  getFailedPayments,
  getOngoingBookingsAsBookings,
  getPaymentTransactions,
  getPayoutRequests,
  getRefundRequests,
  getServiceCategories,
  getStoredAdminSession,
  markRefundProcessed,
  updateCustomerStatus as apiUpdateCustomerStatus,
  updateDisputeStatus as apiUpdateDisputeStatus,
  updatePayoutStatus,
} from "../lib/adminApi";

interface DataContextType {
  isLoading: boolean;
  error: string | null;

  // Data
  serviceCategories: ServiceCategory[];
  serviceProviders: ServiceProvider[];
  customers: Customer[];
  bookings: Booking[];
  transactions: Transaction[];
  payoutRequests: PayoutRequest[];
  disputes: Dispute[];
  refunds: Refund[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];

  // Computed Data
  dashboardStats: DashboardStats;

  // Helper Functions
  getCustomerById: (id: string) => Customer | undefined;
  getProviderById: (id: string) => ServiceProvider | undefined;
  getCategoryById: (id: string) => ServiceCategory | undefined;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByCustomer: (customerId: string) => Booking[];
  getBookingsByProvider: (providerId: string) => Booking[];
  getTransactionsByProvider: (providerId: string) => Transaction[];
  calculateProviderEarnings: (providerId: string) => ProviderEarning;

  // Actions
  updateBookingStatus: (bookingId: string, status: Booking["status"]) => void;
  approveRefund: (refundId: string) => void;
  rejectRefund: (refundId: string, reason: string) => void;
  updateProviderStatus: (providerId: string, status: ServiceProvider["status"]) => void;
  approvePayoutRequest: (payoutId: string) => void;
  rejectPayoutRequest: (payoutId: string) => void;
  updateCommissionRate: (categoryId: string, newRate: number) => void;
  addAuditLog: (action: string, userId: string, details: string) => void;
  updateCustomerStatus: (customerId: string, status: Customer["status"]) => void;
  resolveDispute: (disputeId: string, status: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    dataStore.serviceCategories
  );
  const [serviceProviders] = useState<ServiceProvider[]>(dataStore.serviceProviders);
  const [customers, setCustomers] = useState<Customer[]>(dataStore.customers);
  const [bookings, setBookings] = useState<Booking[]>(dataStore.bookings);
  const [transactions, setTransactions] = useState<Transaction[]>(dataStore.transactions);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(
    dataStore.payoutRequests
  );
  const [disputes, setDisputes] = useState<Dispute[]>(dataStore.disputes);
  const [refunds, setRefunds] = useState<Refund[]>(dataStore.refunds);
  const [adminUsers] = useState<AdminUser[]>(dataStore.adminUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(dataStore.auditLogs);

  // Fetch all collections that have real backend endpoints
  useEffect(() => {
    const token = accessToken ?? getStoredAdminSession()?.accessToken;
    if (!isAuthenticated || !token) {
      return;
    }

    let isMounted = true;

    const loadRemoteCollections = async () => {
      setIsLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        getServiceCategories(),                    // 0 — no auth needed
        getCustomers(token),                       // 1
        getDisputes(token),                        // 2
        getPayoutRequests(token),                  // 3
        getRefundRequests(token),                  // 4
        getFailedPayments(token),                  // 5 — used as Transaction fallback
        getOngoingBookingsAsBookings(token),       // 6
        getBookingHistory(token),                  // 7
        getPaymentTransactions(token),             // 8
        getAdminActivityLog(token),                // 9 — stub, returns [] for now
      ]);

      if (!isMounted) return;

      const [
        categoriesResult,
        customersResult,
        disputesResult,
        payoutsResult,
        refundsResult,
        failedResult,
        ongoingResult,
        historyResult,
        paymentsResult,
        activityResult,
      ] = results;

      if (categoriesResult.status === "fulfilled" && categoriesResult.value.length > 0) {
        setServiceCategories(categoriesResult.value);
      }

      if (customersResult.status === "fulfilled" && customersResult.value.length > 0) {
        setCustomers(customersResult.value);
      }

      if (disputesResult.status === "fulfilled" && disputesResult.value.length > 0) {
        setDisputes(disputesResult.value);
      }

      if (payoutsResult.status === "fulfilled" && payoutsResult.value.length > 0) {
        setPayoutRequests(payoutsResult.value);
      }

      if (refundsResult.status === "fulfilled" && refundsResult.value.length > 0) {
        setRefunds(refundsResult.value);
      }

      // Merge ongoing + history bookings, deduplicating by id
      const ongoingBookings =
        ongoingResult.status === "fulfilled" ? ongoingResult.value : [];
      const historyBookings =
        historyResult.status === "fulfilled" ? historyResult.value : [];
      const allBookings = [...ongoingBookings, ...historyBookings];
      if (allBookings.length > 0) {
        const seen = new Set<string>();
        const deduped = allBookings.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
        setBookings(deduped);
      }

      // Prefer real payment transactions; fall back to failed-payments list
      if (paymentsResult.status === "fulfilled" && paymentsResult.value.length > 0) {
        setTransactions(paymentsResult.value);
      } else if (failedResult.status === "fulfilled" && failedResult.value.length > 0) {
        setTransactions(failedResult.value);
      }

      if (activityResult.status === "fulfilled" && activityResult.value.length > 0) {
        setAuditLogs(activityResult.value);
      }

      // Surface the first error that occurred (non-blocking — data already set above)
      const firstFailure = results.find((r) => r.status === "rejected");
      if (firstFailure && firstFailure.status === "rejected") {
        const reason =
          firstFailure.reason instanceof Error
            ? firstFailure.reason.message
            : "Failed to load some admin data.";
        setError(reason);
      }

      setIsLoading(false);
    };

    void loadRemoteCollections();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated]);

  // ── Dashboard stats (derived from live state) ──────────────────────────

  const dashboardStats: DashboardStats = useMemo(() => {
    const completedPaid = bookings.filter(
      (b) => b.status === "Completed" && b.paymentStatus === "Paid"
    );
    const totalRevenue = completedPaid.reduce((sum, b) => sum + b.amount, 0);
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const completionRate = bookings.length > 0 ? (completed / bookings.length) * 100 : 0;

    return {
      totalRevenue,
      totalBookings: bookings.length,
      activeProviders: serviceProviders.filter((p) => p.status === "Active").length,
      activeCustomers: customers.filter((c) => c.status === "Active").length,
      completionRate,
      avgBookingValue:
        bookings.length > 0
          ? bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length
          : 0,
    };
  }, [bookings, serviceProviders, customers]);

  // ── State-aware helper functions ────────────────────────────────────────

  const getCustomerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const getProviderById = useCallback(
    (id: string) => serviceProviders.find((p) => p.id === id),
    [serviceProviders]
  );

  const getCategoryById = useCallback(
    (id: string) => serviceCategories.find((c) => c.id === id),
    [serviceCategories]
  );

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings]
  );

  const getBookingsByCustomer = useCallback(
    (customerId: string) => bookings.filter((b) => b.customerId === customerId),
    [bookings]
  );

  const getBookingsByProvider = useCallback(
    (providerId: string) => bookings.filter((b) => b.providerId === providerId),
    [bookings]
  );

  const getTransactionsByProvider = useCallback(
    (providerId: string) => transactions.filter((t) => t.providerId === providerId),
    [transactions]
  );

  const calculateProviderEarnings = useCallback(
    (providerId: string): ProviderEarning => {
      const providerBookings = bookings.filter((b) => b.providerId === providerId);
      const completedBookings = providerBookings.filter((b) => b.status === "Completed");
      const paidBookings = completedBookings.filter((b) => b.paymentStatus === "Paid");
      const totalEarnings = paidBookings.reduce((sum, b) => sum + b.providerEarnings, 0);
      const pendingEarnings = completedBookings
        .filter((b) => b.paymentStatus === "Pending")
        .reduce((sum, b) => sum + b.providerEarnings, 0);
      const providerPayouts = payoutRequests.filter(
        (p) => p.providerId === providerId && p.status === "Released"
      );
      const lastPayout =
        providerPayouts.length > 0 ? providerPayouts[providerPayouts.length - 1] : undefined;
      return {
        providerId,
        totalEarnings,
        pendingEarnings,
        paidEarnings: totalEarnings - pendingEarnings,
        totalBookings: providerBookings.length,
        completedBookings: completedBookings.length,
        lastPayoutDate: lastPayout?.processedDate,
      };
    },
    [bookings, payoutRequests]
  );

  // ── Actions ─────────────────────────────────────────────────────────────

  const updateBookingStatus = useCallback(
    (bookingId: string, status: Booking["status"]) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status,
                completedDate:
                  status === "Completed" ? new Date().toISOString() : booking.completedDate,
              }
            : booking
        )
      );

      if (status === "Completed") {
        setBookings((prev) => {
          const booking = prev.find((b) => b.id === bookingId);
          if (booking) {
            setTransactions((txns) => [
              ...txns,
              {
                id: `TXN-${Date.now()}`,
                bookingId: booking.id,
                customerId: booking.customerId,
                providerId: booking.providerId,
                amount: booking.amount,
                commissionAmount: booking.commissionAmount,
                providerEarnings: booking.providerEarnings,
                paymentMethod: booking.paymentMethod,
                paymentStatus: booking.paymentStatus,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
          return prev;
        });
      }
    },
    []
  );

  const approveRefund = useCallback((refundId: string) => {
    const token = accessToken ?? getStoredAdminSession()?.accessToken;
    if (token) {
      void markRefundProcessed(token, refundId);
    }
    setRefunds((prev) =>
      prev.map((refund) =>
        refund.id === refundId
          ? { ...refund, status: "Approved", processedDate: new Date().toISOString() }
          : refund
      )
    );
  }, [accessToken]);

  const rejectRefund = useCallback((_refundId: string, _reason: string) => {
    setRefunds((prev) =>
      prev.map((refund) =>
        refund.id === _refundId
          ? { ...refund, status: "Rejected", processedDate: new Date().toISOString() }
          : refund
      )
    );
  }, []);

  const updateProviderStatus = useCallback(
    (providerId: string, status: ServiceProvider["status"]) => {
      // serviceProviders is static mock — no backend endpoint for admin provider list yet
      void providerId;
      void status;
    },
    []
  );

  const approvePayoutRequest = useCallback((payoutId: string) => {
    const token = accessToken ?? getStoredAdminSession()?.accessToken;
    if (token) {
      void updatePayoutStatus(token, payoutId, "Approved");
    }
    setPayoutRequests((prev) =>
      prev.map((payout) =>
        payout.id === payoutId
          ? { ...payout, status: "Approved", processedDate: new Date().toISOString() }
          : payout
      )
    );
  }, [accessToken]);

  const rejectPayoutRequest = useCallback((payoutId: string) => {
    const token = accessToken ?? getStoredAdminSession()?.accessToken;
    if (token) {
      void updatePayoutStatus(token, payoutId, "Rejected");
    }
    setPayoutRequests((prev) =>
      prev.map((payout) =>
        payout.id === payoutId
          ? { ...payout, status: "Rejected", processedDate: new Date().toISOString() }
          : payout
      )
    );
  }, [accessToken]);

  const updateCommissionRate = useCallback((categoryId: string, newRate: number) => {
    setServiceCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, commissionRate: newRate } : category
      )
    );
  }, []);

  const addAuditLog = useCallback((action: string, userId: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: "—",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  const updateCustomerStatus = useCallback(
    (customerId: string, status: Customer["status"]) => {
      const token = accessToken ?? getStoredAdminSession()?.accessToken;
      if (token) {
        void apiUpdateCustomerStatus(token, customerId, status);
      }
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status } : c))
      );
    },
    [accessToken]
  );

  const resolveDispute = useCallback(
    (disputeId: string, status: string) => {
      const token = accessToken ?? getStoredAdminSession()?.accessToken;
      if (token) {
        void apiUpdateDisputeStatus(token, disputeId, status);
      }
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? {
                ...d,
                status: status as Dispute["status"],
                resolvedAt:
                  status === "Resolved" ? new Date().toISOString() : d.resolvedAt,
              }
            : d
        )
      );
    },
    [accessToken]
  );

  const value: DataContextType = {
    isLoading,
    error,
    serviceCategories,
    serviceProviders,
    customers,
    bookings,
    transactions,
    payoutRequests,
    disputes,
    refunds,
    adminUsers,
    auditLogs,
    dashboardStats,
    getCustomerById,
    getProviderById,
    getCategoryById,
    getBookingById,
    getBookingsByCustomer,
    getBookingsByProvider,
    getTransactionsByProvider,
    calculateProviderEarnings,
    updateBookingStatus,
    approveRefund,
    rejectRefund,
    updateProviderStatus,
    approvePayoutRequest,
    rejectPayoutRequest,
    updateCommissionRate,
    addAuditLog,
    updateCustomerStatus,
    resolveDispute,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
