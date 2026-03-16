import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type {
  DashboardQueryResult,
  ExpenseCategory,
  ExpenseEntry,
  IncomeEntry,
  PaymentMode,
  PdfReport,
  ReportPeriod,
  UserProfile,
} from "../backend";
import { generateMonthlyReportPDF } from "../lib/monthlyReportGenerator";
import { useActor } from "./useActor";

type PaymentModeTotals = {
  totalCash: number;
  totalBank: number;
  totalBalancePayment: number;
  totalUpi: number;
  totalCheque: number;
  totalIncome: number;
};

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetIncomeEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<IncomeEntry[]>({
    queryKey: ["incomeEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomeEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIncomeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      fromDestination: string;
      toDestination: string;
      assignee: string;
      driver: string;
      vehicle: string;
      amount: number;
      date: bigint;
      paymentMode: PaymentMode;
      paymentDescription: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addIncomeEntry(
        data.description,
        data.fromDestination,
        data.toDestination,
        data.assignee,
        data.driver,
        data.vehicle,
        data.amount,
        data.date,
        data.paymentMode,
        data.paymentDescription,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["incomePaymentModeTotals"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForCustomPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForFinancialYear"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useUpdateIncomeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      description: string;
      fromDestination: string;
      toDestination: string;
      assignee: string;
      driver: string;
      vehicle: string;
      amount: number;
      date: bigint;
      paymentMode: PaymentMode;
      paymentDescription: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateIncomeEntry(
        data.id,
        data.description,
        data.fromDestination,
        data.toDestination,
        data.assignee,
        data.driver,
        data.vehicle,
        data.amount,
        data.date,
        data.paymentMode,
        data.paymentDescription,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["incomePaymentModeTotals"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForCustomPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["incomeForFinancialYear"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useGetExpenseEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<ExpenseEntry[]>({
    queryKey: ["expenseEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenseEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpenseEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: ExpenseCategory;
      description: string;
      amount: number;
      date: bigint;
      paymentMode: PaymentMode;
      paymentDescription: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addExpenseEntry(
        data.category,
        data.description,
        data.amount,
        data.date,
        data.paymentMode,
        data.paymentDescription,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseEntries"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForCustomPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForFinancialYear"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useUpdateExpenseEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      category: ExpenseCategory;
      description: string;
      amount: number;
      date: bigint;
      paymentMode: PaymentMode;
      paymentDescription: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateExpenseEntry(
        data.id,
        data.category,
        data.description,
        data.amount,
        data.date,
        data.paymentMode,
        data.paymentDescription,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseEntries"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForCustomPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["expensesForFinancialYear"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
}

export function useGetIncomeForPeriod(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<IncomeEntry[]>({
    queryKey: ["incomeForPeriod", startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomeForPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetExpensesForPeriod(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<ExpenseEntry[]>({
    queryKey: ["expensesForPeriod", startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesForPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetIncomeForCustomPeriod(
  startDate: bigint,
  endDate: bigint,
  enabled = true,
) {
  const { actor, isFetching } = useActor();

  return useQuery<IncomeEntry[]>({
    queryKey: [
      "incomeForCustomPeriod",
      startDate.toString(),
      endDate.toString(),
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomeForCustomPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetExpensesForCustomPeriod(
  startDate: bigint,
  endDate: bigint,
  enabled = true,
) {
  const { actor, isFetching } = useActor();

  return useQuery<ExpenseEntry[]>({
    queryKey: [
      "expensesForCustomPeriod",
      startDate.toString(),
      endDate.toString(),
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesForCustomPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetIncomeForFinancialYear(year: number, enabled = true) {
  const { actor, isFetching } = useActor();

  return useQuery<IncomeEntry[]>({
    queryKey: ["incomeForFinancialYear", year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomeForFinancialYear(BigInt(year));
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetExpensesForFinancialYear(year: number, enabled = true) {
  const { actor, isFetching } = useActor();

  return useQuery<ExpenseEntry[]>({
    queryKey: ["expensesForFinancialYear", year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesForFinancialYear(BigInt(year));
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetIncomePaymentModeTotals() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentModeTotals>({
    queryKey: ["incomePaymentModeTotals"],
    queryFn: async () => {
      if (!actor)
        return {
          totalCash: 0,
          totalBank: 0,
          totalBalancePayment: 0,
          totalUpi: 0,
          totalCheque: 0,
          totalIncome: 0,
        };
      return actor.getIncomePaymentModeTotals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDashboardData(
  startDate: bigint,
  endDate: bigint,
  enabled = true,
) {
  const { actor, isFetching } = useActor();

  return useQuery<DashboardQueryResult>({
    queryKey: ["dashboardData", startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) {
        return {
          __kind__: "dashboardError",
          dashboardError: { message: "Actor not available" },
        } as DashboardQueryResult;
      }
      return actor.getDashboardDataForCustomPeriod(startDate, endDate);
    },
    enabled: !!actor && !isFetching && enabled,
    retry: false,
  });
}

export function useGetAllPdfReports() {
  const { actor, isFetching } = useActor();

  return useQuery<PdfReport[]>({
    queryKey: ["pdfReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPdfReports();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMonthlyReportsForYear(year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<PdfReport[]>({
    queryKey: ["monthlyReports", year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyReportsForYear(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePdfReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      period: ReportPeriod;
      blob: ExternalBlob;
      startDate?: bigint;
      endDate?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.savePdfReport(
        data.title,
        data.period,
        data.blob,
        data.startDate ?? null,
        data.endDate ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfReports"] });
    },
  });
}

export function useGenerateMonthlyReportForPeriod() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!actor) throw new Error("Actor not available");

      // Validate inputs
      if (month < 1 || month > 12) {
        throw new Error("Invalid month. Must be between 1 and 12.");
      }

      if (year < 2000 || year > 2100) {
        throw new Error("Invalid year. Must be between 2000 and 2100.");
      }

      // Create date range for the specified month
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const startDateNanos = BigInt(startDate.getTime()) * BigInt(1_000_000);
      const endDateNanos = BigInt(endDate.getTime()) * BigInt(1_000_000);

      // Fetch data for the period with error handling
      let incomeEntries: IncomeEntry[];
      let expenseEntries: ExpenseEntry[];

      try {
        [incomeEntries, expenseEntries] = await Promise.all([
          actor.getIncomeForPeriod(startDateNanos, endDateNanos),
          actor.getExpensesForPeriod(startDateNanos, endDateNanos),
        ]);
      } catch (_error) {
        throw new Error("Failed to fetch data from backend. Please try again.");
      }

      // Validate that we have data
      if (!incomeEntries || !expenseEntries) {
        throw new Error("Failed to fetch data from backend");
      }

      if (!Array.isArray(incomeEntries) || !Array.isArray(expenseEntries)) {
        throw new Error("Invalid data format received from backend");
      }

      if (incomeEntries.length === 0 && expenseEntries.length === 0) {
        throw new Error("No data available for this period");
      }

      // Calculate totals with validation
      const totalIncome = incomeEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid income amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const totalExpenses = expenseEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid expense amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const netProfitLoss = totalIncome - totalExpenses;

      // Calculate payment mode totals with validation
      const totalCash = incomeEntries
        .filter((e) => e.paymentMode === "cash")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBank = incomeEntries
        .filter((e) => e.paymentMode === "bank")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBalance = incomeEntries
        .filter((e) => e.paymentMode === "balancePayment")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const periodLabel = `${monthNames[month - 1]} ${year}`;

      // Generate PDF with comprehensive validation
      let pdfBytes: Uint8Array<ArrayBuffer>;
      try {
        pdfBytes = await generateMonthlyReportPDF({
          incomeEntries,
          expenseEntries,
          totalIncome,
          totalExpenses,
          netProfitLoss,
          period: periodLabel,
          totalCash,
          totalBank,
          totalBalance,
        });
      } catch (error) {
        throw new Error(
          `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Verify PDF bytes before saving
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error("Generated PDF is empty");
      }

      if (pdfBytes.length < 100) {
        throw new Error("Generated PDF is too small to be valid");
      }

      // Verify PDF signature (%PDF- magic bytes)
      const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];
      for (let i = 0; i < pdfSignature.length; i++) {
        if (pdfBytes[i] !== pdfSignature[i]) {
          throw new Error("Generated PDF has invalid format");
        }
      }

      // Create ExternalBlob from validated PDF bytes
      const blob = ExternalBlob.fromBytes(pdfBytes);

      // Save to backend
      const reportPeriod: ReportPeriod = {
        __kind__: "monthly",
        monthly: {
          month: BigInt(month),
          year: BigInt(year),
        },
      };

      const title = `Monthly_P&L_Report_-_${periodLabel.replace(" ", "_")}`;

      let reportId: number;
      try {
        reportId = await actor.savePdfReport(
          title,
          reportPeriod,
          blob,
          startDateNanos,
          endDateNanos,
        );
      } catch (_error) {
        throw new Error(
          "Failed to save PDF report to backend. Please try again.",
        );
      }

      return { title, period: periodLabel, reportId, size: pdfBytes.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfReports"] });
    },
  });
}

export function useGenerateMonthlyReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");

      // Calculate the previous month correctly
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11

      // Get previous month (handle January -> December of previous year)
      let targetMonth: number;
      let targetYear: number;

      if (currentMonth === 0) {
        // January -> get December of previous year
        targetMonth = 11; // December (0-indexed)
        targetYear = currentYear - 1;
      } else {
        targetMonth = currentMonth - 1;
        targetYear = currentYear;
      }

      // Create date range for the target month
      const startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const startDateNanos = BigInt(startDate.getTime()) * BigInt(1_000_000);
      const endDateNanos = BigInt(endDate.getTime()) * BigInt(1_000_000);

      // Fetch data for the period with error handling
      let incomeEntries: IncomeEntry[];
      let expenseEntries: ExpenseEntry[];

      try {
        [incomeEntries, expenseEntries] = await Promise.all([
          actor.getIncomeForPeriod(startDateNanos, endDateNanos),
          actor.getExpensesForPeriod(startDateNanos, endDateNanos),
        ]);
      } catch (_error) {
        throw new Error("Failed to fetch data from backend. Please try again.");
      }

      // Validate that we have data
      if (!incomeEntries || !expenseEntries) {
        throw new Error("Failed to fetch data from backend");
      }

      if (!Array.isArray(incomeEntries) || !Array.isArray(expenseEntries)) {
        throw new Error("Invalid data format received from backend");
      }

      if (incomeEntries.length === 0 && expenseEntries.length === 0) {
        throw new Error("No data available for this period");
      }

      // Calculate totals with validation
      const totalIncome = incomeEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid income amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const totalExpenses = expenseEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid expense amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const netProfitLoss = totalIncome - totalExpenses;

      // Calculate payment mode totals with validation
      const totalCash = incomeEntries
        .filter((e) => e.paymentMode === "cash")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBank = incomeEntries
        .filter((e) => e.paymentMode === "bank")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBalance = incomeEntries
        .filter((e) => e.paymentMode === "balancePayment")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      // Use targetMonth (0-indexed) to get the correct month name
      const periodLabel = `${monthNames[targetMonth]} ${targetYear}`;

      // Generate PDF with comprehensive validation
      let pdfBytes: Uint8Array<ArrayBuffer>;
      try {
        pdfBytes = await generateMonthlyReportPDF({
          incomeEntries,
          expenseEntries,
          totalIncome,
          totalExpenses,
          netProfitLoss,
          period: periodLabel,
          totalCash,
          totalBank,
          totalBalance,
        });
      } catch (error) {
        throw new Error(
          `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Verify PDF bytes before saving
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error("Generated PDF is empty");
      }

      if (pdfBytes.length < 100) {
        throw new Error("Generated PDF is too small to be valid");
      }

      // Verify PDF signature (%PDF- magic bytes)
      const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];
      for (let i = 0; i < pdfSignature.length; i++) {
        if (pdfBytes[i] !== pdfSignature[i]) {
          throw new Error("Generated PDF has invalid format");
        }
      }

      // Create ExternalBlob from validated PDF bytes
      const blob = ExternalBlob.fromBytes(pdfBytes);

      // Save to backend with correct month (1-indexed for backend)
      const reportPeriod: ReportPeriod = {
        __kind__: "monthly",
        monthly: {
          month: BigInt(targetMonth + 1), // Convert to 1-indexed
          year: BigInt(targetYear),
        },
      };

      const title = `Monthly_P&L_Report_-_${periodLabel.replace(" ", "_")}`;

      let reportId: number;
      try {
        reportId = await actor.savePdfReport(
          title,
          reportPeriod,
          blob,
          startDateNanos,
          endDateNanos,
        );
      } catch (_error) {
        throw new Error(
          "Failed to save PDF report to backend. Please try again.",
        );
      }

      return { title, period: periodLabel, reportId, size: pdfBytes.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfReports"] });
    },
  });
}

export function useGenerateWeeklyReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");

      // Calculate the previous week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since last Monday

      // Get the Monday of the previous week
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);

      // Get the Sunday of the previous week
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      const startDateNanos = BigInt(lastMonday.getTime()) * BigInt(1_000_000);
      const endDateNanos = BigInt(lastSunday.getTime()) * BigInt(1_000_000);

      // Calculate week number (ISO week)
      const getWeekNumber = (date: Date): number => {
        const d = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
      };

      const weekNumber = getWeekNumber(lastMonday);
      const weekYear = lastMonday.getFullYear();

      // Fetch data for the period with error handling
      let incomeEntries: IncomeEntry[];
      let expenseEntries: ExpenseEntry[];

      try {
        [incomeEntries, expenseEntries] = await Promise.all([
          actor.getIncomeForPeriod(startDateNanos, endDateNanos),
          actor.getExpensesForPeriod(startDateNanos, endDateNanos),
        ]);
      } catch (_error) {
        throw new Error("Failed to fetch data from backend. Please try again.");
      }

      // Validate that we have data
      if (!incomeEntries || !expenseEntries) {
        throw new Error("Failed to fetch data from backend");
      }

      if (!Array.isArray(incomeEntries) || !Array.isArray(expenseEntries)) {
        throw new Error("Invalid data format received from backend");
      }

      if (incomeEntries.length === 0 && expenseEntries.length === 0) {
        throw new Error("No data available for this period");
      }

      // Calculate totals with validation
      const totalIncome = incomeEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid income amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const totalExpenses = expenseEntries.reduce((sum, entry) => {
        if (typeof entry.amount !== "number" || Number.isNaN(entry.amount)) {
          console.warn("Invalid expense amount:", entry);
          return sum;
        }
        return sum + entry.amount;
      }, 0);

      const netProfitLoss = totalIncome - totalExpenses;

      // Calculate payment mode totals with validation
      const totalCash = incomeEntries
        .filter((e) => e.paymentMode === "cash")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBank = incomeEntries
        .filter((e) => e.paymentMode === "bank")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const totalBalance = incomeEntries
        .filter((e) => e.paymentMode === "balancePayment")
        .reduce(
          (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
          0,
        );

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const periodLabel = `Week ${weekNumber} (${lastMonday.getDate()} ${monthNames[lastMonday.getMonth()]} - ${lastSunday.getDate()} ${monthNames[lastSunday.getMonth()]} ${weekYear})`;

      // Generate PDF with comprehensive validation
      let pdfBytes: Uint8Array<ArrayBuffer>;
      try {
        pdfBytes = await generateMonthlyReportPDF({
          incomeEntries,
          expenseEntries,
          totalIncome,
          totalExpenses,
          netProfitLoss,
          period: periodLabel,
          totalCash,
          totalBank,
          totalBalance,
        });
      } catch (error) {
        throw new Error(
          `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Verify PDF bytes before saving
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error("Generated PDF is empty");
      }

      if (pdfBytes.length < 100) {
        throw new Error("Generated PDF is too small to be valid");
      }

      // Verify PDF signature (%PDF- magic bytes)
      const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];
      for (let i = 0; i < pdfSignature.length; i++) {
        if (pdfBytes[i] !== pdfSignature[i]) {
          throw new Error("Generated PDF has invalid format");
        }
      }

      // Create ExternalBlob from validated PDF bytes
      const blob = ExternalBlob.fromBytes(pdfBytes);

      // Save to backend
      const reportPeriod: ReportPeriod = {
        __kind__: "weekly",
        weekly: {
          week: BigInt(weekNumber),
          year: BigInt(weekYear),
        },
      };

      const title = `Weekly_P&L_Report_-_Week_${weekNumber}_${weekYear}`;

      let reportId: number;
      try {
        reportId = await actor.savePdfReport(
          title,
          reportPeriod,
          blob,
          startDateNanos,
          endDateNanos,
        );
      } catch (_error) {
        throw new Error(
          "Failed to save PDF report to backend. Please try again.",
        );
      }

      return { title, period: periodLabel, reportId, size: pdfBytes.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfReports"] });
    },
  });
}
