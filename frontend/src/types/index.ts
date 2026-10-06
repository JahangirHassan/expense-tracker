export type CategoryType = "income" | "expense" | "both";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "wallet";
export type IncomeSource =
  | "salary"
  | "freelance"
  | "gifts"
  | "investments"
  | "other";
export type RecurrenceInterval = "daily" | "weekly" | "monthly" | "yearly";
export type BudgetPeriod = "weekly" | "monthly";

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  fullName: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IExpense {
  _id: string;
  user: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  budget: IBudget;
  receiptUrl?: string;
  isRecurring: boolean;
  summary: { totalExpenses: number; totalDocuments: number };
  recurrenceInterval?: RecurrenceInterval;
  createdAt?: string;
  updatedAt?: string;
}

export interface IIncome {
  _id: string;
  user: string;
  amount: number;
  source: IncomeSource;
  date: string;
  notes?: string;
  isRecurring: boolean;
  summary: { totalIncome: number; totalDocuments: number };
  recurrenceInterval?: RecurrenceInterval;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBudget {
  _id: string;
  user: string;
  name: string;
  limitAmount: number;
  period: BudgetPeriod;
  status: "green" | "yellow" | "red";
  rollover: boolean;
  startDate: string;
  createdAt?: string;
  updatedAt?: string;
  percentageUsed?: number;
  spentAmount?: number;
  remainingAmount?: number;
  description?: string;
  alert?: boolean;
  message?: string | null;
}

export interface IBudgetStatus {
  _id: string;
  budget: IBudget;
  periodStart: string;
  periodEnd: string;
  spentThisPeriod: number;
  effectiveLimit: number;
  remaining: number;
  percentUsed: number;
  status: "green" | "yellow" | "red";
  alert: boolean | null;
}

export interface IExpenseBreakdownItem {
  budgetId: string;
  budgetName: string;
  totalSpent: number;
  count: number;
  limitAmount: number;
}
export interface IIncomeVsExpenseItem {
  period: string; // e.g. "2026-07-29" or "2026-W30" or "2026-07"
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  date: Date;
  totalAmount: number;
}

// income trend
export interface IIncomeTrendItem {
  totalAmount: string;
  count: string;
  date: Date;
}
// budget vs actual interface

export interface IBudgetVsActualItem {
  _id: string;
  name: string;
  limitAmount: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  period: string;
}

export interface IExpenseByPaymentMethodItem {
  totalAmount: number;
  count: string;
  date: Date;
  paymentMethod: PaymentMethod;
}

export interface ISpendingTrendItem {
  date: string;
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
  netSavings: number;
}

export interface ParsedReceipt {
  merchant?: string;
  date?: Date;
  subtotal?: number;
  tax?: number;
  total?: number;
  items: {
    name: string;
    amount: number;
  }[];
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: unknown[];
  success: boolean;
}
