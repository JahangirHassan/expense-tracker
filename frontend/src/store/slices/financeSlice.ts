import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/axios";
import {
  IExpense,
  IIncome,
  IBudget,
  IExpenseBreakdownItem,
  IIncomeVsExpenseItem,
  ISpendingTrendItem,
  ParsedReceipt,
  ApiResponse,
  IIncomeTrendItem,
  IBudgetVsActualItem,
  IExpenseByPaymentMethodItem,
  IBudgetStatus,
} from "@/types";
import axios from "axios";

interface FinanceState {
  expenses: IExpense[];
  selectedExpense: IExpense | null;
  expensesTotal: number;
  incomes: IIncome[];
  incomesTotal: number;
  selectedIncome: IIncome | null;
  budgets: IBudget[];
  budgetStats: IBudgetStatus[];
  selectedBudget: IBudget | null;
  expenseBreakdown: IExpenseBreakdownItem[];
  expenseByPaymentMethod: IExpenseByPaymentMethodItem[];
  budgetVsActual: IBudgetVsActualItem[];
  incomeVsExpense: IIncomeVsExpenseItem[];
  spendingTrend: ISpendingTrendItem[];
  incomeTrend: IIncomeTrendItem | null;
  lastScannedReceipt: ParsedReceipt | null;
  loading: boolean;
  ocrLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: FinanceState = {
  expenses: [],
  selectedExpense: null,
  expensesTotal: 0,
  incomes: [],
  incomesTotal: 0,
  selectedIncome: null,
  budgets: [],
  budgetStats: [],
  selectedBudget: null,
  expenseBreakdown: [],
  expenseByPaymentMethod: [],
  budgetVsActual: [],
  incomeVsExpense: [],
  incomeTrend: null,
  spendingTrend: [],
  lastScannedReceipt: null,
  loading: false,
  ocrLoading: false,
  error: null,
  successMessage: null,
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

// ============ EXPENSES ============

export const fetchExpensesThunk = createAsyncThunk(
  "finance/fetchExpenses",
  async (params: Record<string, string> | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get<
        ApiResponse<{
          expenses: IExpense[];
          summary: { totalExpense: number; totalDocuments: number };
        }>
      >("/expenses", { params: params || {} });
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch expenses"),
      );
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.loading) return false;
      if (state.finance.expenses.length > 0 && !params) return false;
      return true;
    },
  },
);

export const createExpenseThunk = createAsyncThunk(
  "finance/createExpense",
  async (formData: FormData | Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<IExpense>>(
        "/expenses",
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to create expense"),
      );
    }
  },
);
// get expenses by _id
export const fetchExpenseByIdThunk = createAsyncThunk(
  "finance/fetchExpenseById",
  async (expenseId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IExpense>>(
        `/expenses/${expenseId}`,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch expense"),
      );
    }
  },
);

// patch expense by _id
export const updateExpenseThunk = createAsyncThunk(
  "finance/updateExpense",
  async (
    { expenseId, formData }: { expenseId: string; formData: FormData },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch<ApiResponse<IExpense>>(
        `/expenses/${expenseId}`,
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to update expense"),
      );
    }
  },
);
export const deleteExpenseThunk = createAsyncThunk(
  "finance/deleteExpense",
  async (expenseId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      return expenseId;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to delete expense"),
      );
    }
  },
);

// ============ INCOME ============

export const fetchIncomesThunk = createAsyncThunk(
  "finance/fetchIncomes",
  async (params: Record<string, string> | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get<
        ApiResponse<{
          incomes: IIncome[];
          summary: { totalIncome: number; totalDocuments: number };
        }>
      >("/income", { params: params || {} });
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch income"),
      );
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.loading) return false;
      if (state.finance.incomes.length > 0 && !params) return false;
      return true;
    },
  },
);

export const createIncomeThunk = createAsyncThunk(
  "finance/createIncome",
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<IIncome>>("/income", data);
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to create income"),
      );
    }
  },
);
// patch income by _id
export const updateIncomeThunk = createAsyncThunk(
  "finance/updateIncome",
  async (
    { incomeId, formData }: { incomeId: string; formData: FormData },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch<ApiResponse<IIncome>>(
        `/income/${incomeId}`,
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to update income"),
      );
    }
  },
);
// get income by _id
export const fetchIncomeByIdThunk = createAsyncThunk(
  "finance/fetchIncomeById",
  async (incomeId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IIncome>>(
        `/income/${incomeId}`,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch income"),
      );
    }
  },
);

export const deleteIncomeThunk = createAsyncThunk(
  "finance/deleteIncome",
  async (incomeId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/income/${incomeId}`);
      return incomeId;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to delete income"),
      );
    }
  },
);

// ============ BUDGETS ============

export const fetchBudgetsThunk = createAsyncThunk(
  "finance/fetchBudgets",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IBudget[]>>("/budgets");
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch budgets"),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.loading) return false;
      if (state.finance.budgets.length > 0) return false;
      return true;
    },
  },
);

// create budget
export const createBudgetThunk = createAsyncThunk(
  "finance/createBudget",
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<IBudget>>("/budgets", data);

      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save budget"));
    }
  },
);

// update budget
export const updateBudgetThunk = createAsyncThunk(
  "finance/updateBudget",
  async (
    { budgetId, formData }: { budgetId: string; formData: FormData },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch<ApiResponse<IBudget>>(
        `/budgets/${budgetId}`,
        formData,
      );

      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to update budget"),
      );
    }
  },
);

// get budget by _id
export const fetchBudgetByIdThunk = createAsyncThunk(
  "finance/fetchBudgetById",
  async (budgetId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IBudget>>(
        `/budgets/${budgetId}`,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch budget"),
      );
    }
  },
);

// budget statistics
export const fetchBudgetStatisticsThunk = createAsyncThunk(
  "finance/fetchBudgetStatistics",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IBudget[]>>(
        "/budgets/statistics",
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch budget statistics"),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.loading) return false;
      if (state.finance.budgets.length > 0) return false;
      return true;
    },
  },
);

export const deleteBudgetThunk = createAsyncThunk(
  "finance/deleteBudget",
  async (budgetId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/budgets/${budgetId}`);
      return budgetId;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to delete budget"),
      );
    }
  },
);

// ============ CHARTS & ANALYTICS ============

export const fetchExpenseBreakdownThunk = createAsyncThunk(
  "finance/fetchExpenseBreakdown",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IExpenseBreakdownItem[]>>(
        "/charts/expense-by-budget",
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch expense breakdown"),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.expenseBreakdown.length > 0) return false;
      return true;
    },
  },
);

// get income trend
export const fetchIncomeTrendThunk = createAsyncThunk(
  "finance/fetchIncomeTrend",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IIncomeTrendItem>>(
        "/charts/income-trend",
        { params: { days } },
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch income trend"),
      );
    }
  },
);

// get budget vs actual
export const fetchBudgetVsActualThunk = createAsyncThunk(
  "finance/fetchBudgetVsActual",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IBudgetVsActualItem>>(
        "/charts/budget-vs-actual",
        { params: { days } },
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch budget vs actual"),
      );
    }
  },
);

//get expense-by-payment-method

export const fetchExpenseByPaymentMethodThunk = createAsyncThunk(
  "finance/fetchPaymentMethodBreakdown",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<
        ApiResponse<IExpenseByPaymentMethodItem[]>
      >("/charts/expense-by-payment-method");
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch payment method breakdown"),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { finance: FinanceState };
      if (state.finance.expenseByPaymentMethod.length > 0) return false;
      return true;
    },
  },
);

export const fetchIncomeVsExpenseThunk = createAsyncThunk(
  "finance/fetchIncomeVsExpense",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<IIncomeVsExpenseItem[]>>(
        "/charts/monthly-summary",
        { params: { days } },
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch income vs expense"),
      );
    }
  },
);

export const fetchSpendingTrendThunk = createAsyncThunk(
  "finance/fetchSpendingTrend",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<ISpendingTrendItem[]>>(
        "/charts/expense-trend",
        { params: { days } },
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to fetch spending trends"),
      );
    }
  },
);

// ============ RECEIPT OCR ============

export const scanReceiptThunk = createAsyncThunk(
  "finance/scanReceipt",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<ParsedReceipt>>(
        "/expenses/scan-receipt",
        formData,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to scan receipt"),
      );
    }
  },
);

export const confirmReceiptThunk = createAsyncThunk(
  "finance/confirmReceipt",
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<IExpense>>(
        "/expenses/confirm-receipt",
        data,
      );
      return response.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        extractErrorMessage(err, "Failed to confirm receipt"),
      );
    }
  },
);

// ============ SLICE ============

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceError: (state) => {
      state.error = null;
    },
    clearFinanceSuccess: (state) => {
      state.successMessage = null;
    },
    resetScannedReceipt: (state) => {
      state.lastScannedReceipt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Expenses ---
      .addCase(fetchExpensesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpensesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.expenses;
        state.expensesTotal = action.payload.summary?.totalExpense ?? 0;
      })
      .addCase(fetchExpensesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // expense by id
      .addCase(fetchExpenseByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedExpense = action.payload;
      })
      .addCase(fetchExpenseByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // update expense
      .addCase(updateExpenseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpenseThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedExpense = action.payload;
        state.successMessage = "Expense updated successfully!";
      })
      .addCase(updateExpenseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createExpenseThunk.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.successMessage = "Expense added successfully!";
      })
      .addCase(createExpenseThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteExpenseThunk.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(
          (exp) => exp._id !== action.payload,
        );
        state.successMessage = "Expense deleted successfully!";
      })
      .addCase(deleteExpenseThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // --- Income ---
      .addCase(fetchIncomesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes = action.payload.incomes;
        state.incomesTotal = action.payload.summary?.totalIncome ?? 0;
      })
      .addCase(fetchIncomesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createIncomeThunk.fulfilled, (state, action) => {
        state.incomes.unshift(action.payload);
        state.successMessage = "Income added successfully!";
      })
      .addCase(createIncomeThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // update income
      .addCase(updateIncomeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIncomeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIncome = action.payload;
        state.successMessage = "Income updated successfully!";
      })
      .addCase(updateIncomeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // income by id
      .addCase(fetchIncomeByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomeByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIncome = action.payload;
      })
      .addCase(fetchIncomeByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteIncomeThunk.fulfilled, (state, action) => {
        state.incomes = state.incomes.filter(
          (inc) => inc._id !== action.payload,
        );
        state.successMessage = "Income deleted successfully!";
      })
      .addCase(deleteIncomeThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // --- Budgets ---
      .addCase(fetchBudgetsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgetsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgetsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createBudgetThunk.fulfilled, (state) => {
        state.successMessage = "Budget saved successfully!";
      })
      .addCase(createBudgetThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // update budget
      .addCase(updateBudgetThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBudgetThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBudget = action.payload;
        state.successMessage = "Budget updated successfully!";
      })
      .addCase(updateBudgetThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // budget by id
      .addCase(fetchBudgetByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgetByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBudget = action.payload;
      })
      .addCase(fetchBudgetByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteBudgetThunk.fulfilled, (state, action) => {
        state.budgets = state.budgets.filter((b) => b._id !== action.payload);
        state.successMessage = "Budget deleted successfully!";
      })
      .addCase(deleteBudgetThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // --- Charts ---
      .addCase(fetchExpenseBreakdownThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenseBreakdownThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseBreakdown = action.payload;
      })
      .addCase(fetchExpenseBreakdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchIncomeVsExpenseThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncomeVsExpenseThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.incomeVsExpense = action.payload;
      })
      .addCase(fetchIncomeVsExpenseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      //get expense by payment method
      //fetchExpenseByPaymentMethodThunk
      .addCase(fetchExpenseByPaymentMethodThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenseByPaymentMethodThunk.fulfilled, (state, action) => {
        state.expenseByPaymentMethod = action.payload;
      })
      .addCase(fetchExpenseByPaymentMethodThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // get expense vs actual
      //fetchExpenseVsActualThunk
      // .addCase(fetchBudgetVsActualThunk.pending, (state) => {
      //   state.loading = true;
      // })
      // .addCase(fetchBudgetVsActualThunk.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.budgetVsActual = action.payload;
      // })
      // .addCase(fetchBudgetVsActualThunk.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload as string;
      // })

      //fetchIncomeTrendThunk
      .addCase(fetchIncomeTrendThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncomeTrendThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.incomeTrend = action.payload;
      })
      .addCase(fetchIncomeTrendThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchSpendingTrendThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSpendingTrendThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.spendingTrend = action.payload;
      })
      .addCase(fetchSpendingTrendThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // --- Receipt OCR ---
      .addCase(scanReceiptThunk.pending, (state) => {
        state.ocrLoading = true;
        state.error = null;
      })
      .addCase(scanReceiptThunk.fulfilled, (state, action) => {
        state.ocrLoading = false;
        state.lastScannedReceipt = action.payload;
        state.successMessage =
          "Receipt scanned successfully! Please review details.";
      })
      .addCase(scanReceiptThunk.rejected, (state, action) => {
        state.ocrLoading = false;
        state.error = action.payload as string;
      })

      .addCase(confirmReceiptThunk.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.lastScannedReceipt = null;
        state.successMessage = "Receipt confirmed and expense logged!";
      })
      .addCase(confirmReceiptThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearFinanceError, clearFinanceSuccess, resetScannedReceipt } =
  financeSlice.actions;

export default financeSlice.reducer;
