import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export type ReportPeriod = {
    __kind__: "financialYear";
    financialYear: bigint;
} | {
    __kind__: "customRange";
    customRange: {
        endDate: Time;
        startDate: Time;
    };
} | {
    __kind__: "monthly";
    monthly: {
        month: bigint;
        year: bigint;
    };
} | {
    __kind__: "yearly";
    yearly: bigint;
} | {
    __kind__: "daily";
    daily: {
        day: bigint;
        month: bigint;
        year: bigint;
    };
} | {
    __kind__: "weekly";
    weekly: {
        week: bigint;
        year: bigint;
    };
};
export interface BillEntry {
    id: number;
    signature?: string;
    calculatedTotal: number;
    ratePerKm: number;
    owner: Principal;
    gstNumber?: string;
    createdDate: Time;
    distanceKm: number;
    totalAmount: number;
    paymentMode: PaymentMode;
    vehicle: string;
    partyName: string;
}
export type DashboardQueryResult = {
    __kind__: "dashboardError";
    dashboardError: {
        message: string;
    };
} | {
    __kind__: "dashboardQueryResult";
    dashboardQueryResult: {
        expenseTotals: {
            totalBank: number;
            totalCash: number;
            totalUpi: number;
            totalExpenses: number;
            totalCheque: number;
            totalBalancePayment: number;
        };
        incomeTotals: {
            totalIncome: number;
            totalBank: number;
            totalCash: number;
            totalUpi: number;
            totalCheque: number;
            totalBalancePayment: number;
        };
        dateRange: {
            endDate: Time;
            startDate: Time;
        };
    };
};
export interface ExpenseEntry {
    id: number;
    paymentDescription: string;
    owner: Principal;
    date: Time;
    description: string;
    paymentMode: PaymentMode;
    category: ExpenseCategory;
    amount: number;
}
export interface IncomeEntry {
    assignee: string;
    toDestination: string;
    paymentDescription: string;
    owner: Principal;
    fromDestination: string;
    date: Time;
    description: string;
    paymentMode: PaymentMode;
    vehicle: string;
    bytes: number;
    amount: number;
    driver: string;
}
export interface UserProfile {
    name: string;
}
export interface PdfReport {
    id: number;
    title: string;
    endDate?: Time;
    owner: Principal;
    period: ReportPeriod;
    blob: ExternalBlob;
    createdDate: Time;
    startDate?: Time;
}
export enum ExpenseCategory {
    salary = "salary",
    cngGas = "cngGas",
    petrol = "petrol",
    commissionVendor = "commissionVendor",
    tollCharges = "tollCharges",
    diesel = "diesel",
    parkingCharges = "parkingCharges",
    fraud = "fraud",
    maintenanceAndRepair = "maintenanceAndRepair",
    otherExpenses = "otherExpenses",
    purchase = "purchase"
}
export enum PaymentMode {
    upi = "upi",
    balancePayment = "balancePayment",
    bank = "bank",
    cash = "cash",
    cheque = "cheque"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_balance_other_bank_cash {
    balance = "balance",
    other = "other",
    bank = "bank",
    cash = "cash"
}
export interface backendInterface {
    addBillEntry(partyName: string, gstNumber: string | null, vehicle: string, totalAmount: number, paymentMode: PaymentMode, distanceKm: number, ratePerKm: number, signature: string | null): Promise<number>;
    addExpenseEntry(category: ExpenseCategory, description: string, amount: number, date: Time, paymentMode: PaymentMode, paymentDescription: string): Promise<number>;
    addIncomeEntry(description: string, fromDestination: string, toDestination: string, assignee: string, driver: string, vehicle: string, amount: number, date: Time, paymentMode: PaymentMode, paymentDescription: string): Promise<number>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBillEntry(id: number): Promise<void>;
    deleteExpenseEntry(id: number): Promise<void>;
    deleteIncomeEntry(id: number): Promise<void>;
    deletePdfReport(id: number): Promise<void>;
    getAllPdfReports(): Promise<Array<PdfReport>>;
    getBillById(id: number): Promise<BillEntry | null>;
    getBillEntries(): Promise<Array<BillEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardDataForCustomPeriod(startDate: Time, endDate: Time): Promise<DashboardQueryResult>;
    getExpenseCategorySummary(category: ExpenseCategory): Promise<{
        total: number;
        entries: Array<ExpenseEntry>;
    } | null>;
    getExpenseEntries(): Promise<Array<ExpenseEntry>>;
    getExpensePaymentModeTotals(): Promise<{
        totalBank: number;
        totalCash: number;
        totalUpi: number;
        totalExpenses: number;
        totalCheque: number;
        totalBalancePayment: number;
    }>;
    getExpensesByCategory(category: ExpenseCategory): Promise<Array<ExpenseEntry>>;
    getExpensesByPaymentMode(paymentMode: PaymentMode): Promise<Array<ExpenseEntry>>;
    getExpensesForCustomPeriod(startDate: Time, endDate: Time): Promise<Array<ExpenseEntry>>;
    getExpensesForFinancialYear(year: bigint): Promise<Array<ExpenseEntry>>;
    getExpensesForPeriod(startDate: Time, endDate: Time): Promise<Array<ExpenseEntry>>;
    getFilteredIncomeSummary(filter: Variant_balance_other_bank_cash): Promise<{
        total: number;
        entries: Array<IncomeEntry>;
    } | null>;
    getIncomeByPaymentMode(paymentMode: PaymentMode): Promise<Array<IncomeEntry>>;
    getIncomeEntries(): Promise<Array<IncomeEntry>>;
    getIncomeForCustomPeriod(startDate: Time, endDate: Time): Promise<Array<IncomeEntry>>;
    getIncomeForFinancialYear(year: bigint): Promise<Array<IncomeEntry>>;
    getIncomeForPeriod(startDate: Time, endDate: Time): Promise<Array<IncomeEntry>>;
    getIncomePaymentModeTotals(): Promise<{
        totalIncome: number;
        totalBank: number;
        totalCash: number;
        totalUpi: number;
        totalCheque: number;
        totalBalancePayment: number;
    }>;
    getMonthlyReportsForYear(year: bigint): Promise<Array<PdfReport>>;
    getPdfReport(id: number): Promise<PdfReport | null>;
    getPdfReportsForCustomPeriod(startDate: Time, endDate: Time): Promise<Array<PdfReport>>;
    getPdfReportsForFinancialYear(year: bigint): Promise<Array<PdfReport>>;
    getPdfReportsForPeriod(period: ReportPeriod): Promise<Array<PdfReport>>;
    getReportsByPeriod(period: ReportPeriod): Promise<Array<PdfReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePdfReport(title: string, period: ReportPeriod, blob: ExternalBlob, startDate: Time | null, endDate: Time | null): Promise<number>;
    updateBillEntry(id: number, partyName: string, gstNumber: string | null, vehicle: string, totalAmount: number, paymentMode: PaymentMode, distanceKm: number, ratePerKm: number, signature: string | null): Promise<void>;
    updateExpenseEntry(id: number, category: ExpenseCategory, description: string, amount: number, date: Time, paymentMode: PaymentMode, paymentDescription: string): Promise<void>;
    updateIncomeEntry(id: number, description: string, fromDestination: string, toDestination: string, assignee: string, driver: string, vehicle: string, amount: number, date: Time, paymentMode: PaymentMode, paymentDescription: string): Promise<void>;
}
