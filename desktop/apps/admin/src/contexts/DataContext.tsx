// desktop/apps/admin/src/contexts/DataContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import * as adminApi from "../lib/adminApi";
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
  BookingStatus,
  ProviderStatus,
  PaymentStatus,
  PaymentMethod,
} from "../types";

interface DataContextType {
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

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Computed
  dashboardStats: DashboardStats;

  // Helpers
  getCustomerById: (id: string) => Customer | undefined;
  getProviderById: (id: string) => ServiceProvider | undefined;
  getCategoryById: (id: string) => ServiceCategory | undefined;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByCustomer: (customerId: string) => Booking[];
  getBookingsByProvider: (providerId: string) => Booking[];
  getTransactionsByProvider: (providerId: string) => Transaction[];
  calculateProviderEarnings: (providerId: string) => ProviderEarning;

  // Actions
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  approveRefund: (refundId: string) => void;
  rejectRefund: (refundId: string, reason: string) => void;
  updateProviderStatus: (providerId: string, status: ProviderStatus) => void;
  approvePayoutRequest: (payoutId: string) => void;
  updateCommissionRate: (categoryId: string, newRate: number) => void;
  addAuditLog: (action: string, userId: string, details: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [customers] = useState<Customer[]>([]); // TODO: fetch when GET /api/v1/admin/customers exists
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]); // TODO: fetch when GET /api/v1/admin/payout-requests exists
  const [disputes] = useState<Dispute[]>([]); // TODO: fetch when GET /api/v1/admin/disputes exists
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [adminUsers] = useState<AdminUser[]>([]); // TODO: fetch when GET /api/v1/admin/users exists
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const [providers, bookingData, txData] = await Promise.all([
          adminApi.getProviders(),
          adminApi.getBookings(),
          adminApi.getTransactions(),
        ]);

        if (providers) {
          setServiceProviders(
            providers.map((p) => ({
              id: p.id,
              businessName: p.businessName,
              categoryId: p.categoryId,
              contactPerson: p.contactPerson,
              email: p.email,
              phone: p.phone,
              status: p.status as ProviderStatus,
              rating: p.rating,
              totalBookings: p.totalBookings,
              completedBookings: p.completedBookings,
              cancelledBookings: p.cancelledBookings,
              completionRate: p.completionRate,
              joinedDate: p.joinedDate,
              location: p.location,
              totalRevenue: p.totalRevenue,
              totalEarnings: p.totalEarnings,
            })),
          );
        }

        if (bookingData) {
          setBookings(
            bookingData.map((b) => ({
              id: b.id,
              customerId: b.customerId,
              providerId: b.providerId,
              categoryId: b.categoryId,
              serviceDescription: b.serviceDescription,
              scheduledDate: b.scheduledDate,
              completedDate: b.completedDate,
              amount: b.amount,
              commissionAmount: b.commissionAmount,
              providerEarnings: b.providerEarnings,
              status: b.status as BookingStatus,
              paymentStatus: b.paymentStatus as PaymentStatus,
              paymentMethod: b.paymentMethod as PaymentMethod,
              location: b.location,
              createdAt: b.createdAt,
            })),
          );
        }

        if (txData) {
          setTransactions(
            txData.map((t) => ({
              id: t.id,
              bookingId: t.bookingId,
              customerId: t.customerId,
              providerId: t.providerId,
              amount: t.amount,
              commissionAmount: t.commissionAmount,
              providerEarnings: t.providerEarnings,
              paymentMethod: t.paymentMethod as PaymentMethod,
              paymentStatus: t.paymentStatus as PaymentStatus,
              timestamp: t.timestamp,
            })),
          );
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ── Computed dashboard stats ───────────────────────────────────────────────
  const dashboardStats: DashboardStats = {
    totalRevenue: bookings
      .filter((b) => b.status === "Completed" && b.paymentStatus === "Paid")
      .reduce((sum, b) => sum + b.amount, 0),
    totalBookings: bookings.length,
    activeProviders: serviceProviders.filter((p) => p.status === "Active").length,
    activeCustomers: customers.filter((c) => c.status === "Active").length,
    completionRate:
      bookings.length > 0
        ? (bookings.filter((b) => b.status === "Completed").length / bookings.length) * 100
        : 0,
    avgBookingValue:
      bookings.length > 0
        ? bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length
        : 0,
  };

  // ── Helper functions ───────────────────────────────────────────────────────
  const getCustomerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  );

  const getProviderById = useCallback(
    (id: string) => serviceProviders.find((p) => p.id === id),
    [serviceProviders],
  );

  const getCategoryById = useCallback(
    (id: string) => serviceCategories.find((c) => c.id === id),
    [serviceCategories],
  );

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );

  const getBookingsByCustomer = useCallback(
    (customerId: string) => bookings.filter((b) => b.customerId === customerId),
    [bookings],
  );

  const getBookingsByProvider = useCallback(
    (providerId: string) => bookings.filter((b) => b.providerId === providerId),
    [bookings],
  );

  const getTransactionsByProvider = useCallback(
    (providerId: string) => transactions.filter((t) => t.providerId === providerId),
    [transactions],
  );

  const calculateProviderEarnings = useCallback(
    (providerId: string): ProviderEarning => {
      const providerBookings = bookings.filter((b) => b.providerId === providerId);
      const completedBookings = providerBookings.filter((b) => b.status === "Completed");
      const paidBookings = completedBookings.filter((b) => b.paymentStatus === "Paid");
      const pendingEarningsBookings = completedBookings.filter(
        (b) => b.paymentStatus === "Pending",
      );
      const totalEarnings = paidBookings.reduce((sum, b) => sum + b.providerEarnings, 0);
      const pendingEarnings = pendingEarningsBookings.reduce(
        (sum, b) => sum + b.providerEarnings,
        0,
      );
      const releasedPayouts = payoutRequests.filter(
        (p) => p.providerId === providerId && p.status === "Released",
      );
      const lastPayout =
        releasedPayouts.length > 0 ? releasedPayouts[releasedPayouts.length - 1] : undefined;
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
    [bookings, payoutRequests],
  );

  // ── Mutation actions (local state only — each needs a backend call) ─────────

  // TODO: updateBookingStatus → PATCH /api/v1/admin/bookings/:id/status
  const updateBookingStatus = useCallback(
    (bookingId: string, status: BookingStatus) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status,
                completedDate:
                  status === "Completed" ? new Date().toISOString() : booking.completedDate,
              }
            : booking,
        ),
      );
      if (status === "Completed") {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          setTransactions((prev) => [
            ...prev,
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
      }
    },
    [bookings],
  );

  // TODO: approveRefund → PATCH /api/v1/admin/refunds/:id/approve
  const approveRefund = useCallback(
    (refundId: string) => {
      setRefunds((prev) =>
        prev.map((refund) =>
          refund.id === refundId
            ? { ...refund, status: "Approved" as const, processedDate: new Date().toISOString() }
            : refund,
        ),
      );
      const refund = refunds.find((r) => r.id === refundId);
      if (refund) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === refund.bookingId
              ? { ...booking, paymentStatus: "Refunded" as const }
              : booking,
          ),
        );
      }
    },
    [refunds],
  );

  // TODO: rejectRefund → PATCH /api/v1/admin/refunds/:id/reject
  const rejectRefund = useCallback((_refundId: string, _reason: string) => {
    setRefunds((prev) =>
      prev.map((refund) =>
        refund.id === _refundId
          ? { ...refund, status: "Rejected" as const, processedDate: new Date().toISOString() }
          : refund,
      ),
    );
  }, []);

  // TODO: updateProviderStatus → PATCH /api/v1/admin/providers/:id/status
  const updateProviderStatus = useCallback((providerId: string, status: ProviderStatus) => {
    setServiceProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, status } : provider,
      ),
    );
  }, []);

  // TODO: approvePayoutRequest → PATCH /api/v1/admin/payout-requests/:id/approve
  const approvePayoutRequest = useCallback((payoutId: string) => {
    setPayoutRequests((prev) =>
      prev.map((payout) =>
        payout.id === payoutId
          ? { ...payout, status: "Approved" as const, processedDate: new Date().toISOString() }
          : payout,
      ),
    );
  }, []);

  // TODO: updateCommissionRate → PATCH /api/v1/admin/categories/:id/commission
  const updateCommissionRate = useCallback((categoryId: string, newRate: number) => {
    setServiceCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, commissionRate: newRate } : category,
      ),
    );
  }, []);

  // TODO: addAuditLog → POST /api/v1/admin/audit-logs
  const addAuditLog = useCallback((action: string, userId: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: "192.168.1.1",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  const value: DataContextType = {
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
    isLoading,
    error,
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
    updateCommissionRate,
    addAuditLog,
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
