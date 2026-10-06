import { z } from "zod";

export const paymentMethods = [
  "cash",
  "card",
  "bank_transfer",
  "wallet",
] as const;

export const incomeSources = [
  "salary",
  "freelance",
  "gifts",
  "investments",
  "other",
] as const;

export const recurrenceIntervals = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

export const budgetPeriods = ["weekly", "monthly"] as const;

export const categoryTypes = ["income", "expense", "both"] as const;

// Reusable ObjectId validator — matches Mongo's 24-char hex format
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid selection");

// Reusable optional-date validator
const optionalDateSchema = z
  .string()
  .optional()
  .refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date",
  });

// ============ EXPENSE ============

export const expenseSchema = z
  .object({
    amount: z.coerce
      .number({ message: "Amount must be a valid number" })
      .positive("Amount must be greater than zero"),
    budget: objectIdSchema, // was "category" — backend expects "budget"
    date: optionalDateSchema,
    paymentMethod: z.enum(paymentMethods, {
      message: "Select a valid payment method",
    }),
    notes: z
      .string()
      .trim()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(recurrenceIntervals).optional(),
    receipt: z.custom<FileList | File | null>().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurrenceInterval) {
        return false;
      }
      return true;
    },
    {
      message: "Recurrence interval is required when isRecurring is enabled",
      path: ["recurrenceInterval"],
    },
  );

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// ============ INCOME ============

export const incomeSchema = z
  .object({
    amount: z.coerce
      .number({ message: "Amount must be a valid number" })
      .positive("Amount must be greater than zero"),
    source: z.enum(incomeSources, {
      message: "Select a valid income source",
    }),
    date: optionalDateSchema,
    notes: z
      .string()
      .trim()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(recurrenceIntervals).optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurrenceInterval) {
        return false;
      }
      return true;
    },
    {
      message: "Recurrence interval is required when isRecurring is enabled",
      path: ["recurrenceInterval"],
    },
  );

export type IncomeFormData = z.infer<typeof incomeSchema>;

// ============ BUDGET ============

export const budgetSchema = z.object({
  // NOTE: confirm actual Budget model field — using "name" based on
  // budgetObj.name usage seen in budget.controller.ts. Change back to
  // "category" if the model actually uses that field name.
  name: z.string().trim().min(1, "Budget name is required").max(100),
  limitAmount: z.coerce
    .number({ message: "Limit amount must be a valid number" })
    .positive("Limit amount must be greater than zero"),
  period: z.enum(budgetPeriods, {
    message: "Select a valid period (weekly or monthly)",
  }),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  rollover: z.boolean().default(false),
  startDate: optionalDateSchema,
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// ============ RECEIPT CONFIRM ============

export const receiptConfirmSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .positive("Amount must be greater than zero"),
  budget: objectIdSchema, // was "category" — same fix as expenseSchema
  date: optionalDateSchema,
  paymentMethod: z.enum(paymentMethods, {
    message: "Select a valid payment method",
  }),
  notes: z.string().trim().optional(),
  receiptUrl: z.string().optional(),
  merchantName: z.string().trim().optional(),
});

export type ReceiptConfirmFormData = z.infer<typeof receiptConfirmSchema>;
