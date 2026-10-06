"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchExpenseBreakdownThunk,
  fetchIncomeVsExpenseThunk,
  fetchSpendingTrendThunk,
  fetchExpenseByPaymentMethodThunk,
} from "@/store/slices/financeSlice";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
} from "lucide-react";

type RangeOption = "weekly" | "monthly" | "yearly";

// weekly = pichle 7 din, monthly = pichle 30 din, yearly = pichle 365 din
const RANGE_TO_DAYS: Record<RangeOption, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

const formatBucketLabel = (isoDate: string, range: RangeOption) => {
  const d = new Date(isoDate);
  if (range === "yearly") {
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  wallet: "Wallet",
};

// ---- Skeleton components ----

function KpiCardSkeleton() {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <div className="h-2.5 w-28 bg-slate-800 rounded" />
        <div className="h-6 w-20 bg-slate-800 rounded" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-800" />
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
        >
          <div className="w-full flex items-end justify-center gap-1 h-48">
            <div
              className="w-4 bg-slate-800 rounded-t-lg"
              style={{ height: `${30 + ((i * 13) % 50)}%` }}
            />
            <div
              className="w-4 bg-slate-800 rounded-t-lg"
              style={{ height: `${20 + ((i * 17) % 45)}%` }}
            />
          </div>
          <div className="h-2.5 w-8 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function BarListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function RowListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-2.5 w-28 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-24 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function PaymentMethodGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full" />
          <div className="h-2.5 w-20 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const {
    expenseBreakdown,
    incomeVsExpense,
    spendingTrend,
    expenseByPaymentMethod,
    loading, // ✅ Redux-owned loading flag — no local duplicate needed
  } = useAppSelector((state) => state.finance);

  const [range, setRange] = useState<RangeOption>("monthly");

  // Track "first ever load" separately for the two independent fetch
  // groups, so a range change only re-triggers a skeleton for the
  // range-dependent charts, not the all-time ones (and vice versa).
  const [hasFetchedRangeOnce, setHasFetchedRangeOnce] = useState(false);
  const [hasFetchedAllTimeOnce, setHasFetchedAllTimeOnce] = useState(false);

  useEffect(() => {
    const days = RANGE_TO_DAYS[range];
    // No synchronous setState here — dispatch() kicks off the async thunk
    // (loading is toggled inside the Redux slice's own pending/fulfilled
    // reducers), and the only local setState happens inside .finally(),
    // which runs after the promises settle — not synchronously in the
    // effect body.
    Promise.allSettled([
      dispatch(fetchIncomeVsExpenseThunk(days)),
      dispatch(fetchSpendingTrendThunk(days)),
    ]).finally(() => {
      setHasFetchedRangeOnce(true);
    });
  }, [range, dispatch]);

  // All-time aggregations — fetch once on mount, not tied to range selector
  useEffect(() => {
    Promise.allSettled([
      dispatch(fetchExpenseBreakdownThunk()),
      dispatch(fetchExpenseByPaymentMethodThunk()),
    ]).finally(() => setHasFetchedAllTimeOnce(true));
  }, [dispatch]);

  const totalSpentByPaymentMethod = expenseByPaymentMethod.reduce(
    (acc, curr) => acc + curr.totalAmount,
    0,
  );

  const totalIncomeCalc = incomeVsExpense.reduce<number>(
    (acc, curr) => acc + (curr.totalIncome ?? 0),
    0,
  );
  const totalExpenseCalc = incomeVsExpense.reduce<number>(
    (acc, curr) => acc + (curr.totalExpense ?? 0),
    0,
  );
  const savingsRate =
    totalIncomeCalc > 0
      ? Math.max(
          0,
          ((totalIncomeCalc - totalExpenseCalc) / totalIncomeCalc) * 100,
        )
      : 0;

  // Only show the full skeleton on the very first load of each group.
  // After that, a small inline spinner communicates "refreshing" without
  // the whole section flashing/disappearing.
  const isKpiInitialLoading = !hasFetchedRangeOnce;
  const isFlowChartInitialLoading = !hasFetchedRangeOnce;
  const isTrendInitialLoading = !hasFetchedRangeOnce;
  const isBreakdownInitialLoading = !hasFetchedAllTimeOnce;
  const isPaymentMethodInitialLoading = !hasFetchedAllTimeOnce;

  return (
    <div className="space-y-8">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Financial Analytics & Insights
            {loading && hasFetchedRangeOnce && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            )}
          </h1>
          <p className="text-xs text-slate-400">
            Interactive charts detailing budget distribution, cash flow
            comparison, and trend analysis
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {(["weekly", "monthly", "yearly"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              disabled={loading}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                range === r
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Header */}
      {isKpiInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Total Period Income
              </span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                ${totalIncomeCalc.toFixed(2)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Total Period Expenses
              </span>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">
                ${totalExpenseCalc.toFixed(2)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Savings Rate
              </span>
              <h3 className="text-2xl font-bold text-teal-300 mt-1">
                {savingsRate.toFixed(1)}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm">
              %
            </div>
          </div>
        </div>
      )}

      {/* Chart 1: Income vs Expense Bar Comparison */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Income vs. Expense Flow ({range})
            </h2>
            <p className="text-xs text-slate-400">
              Cash inflows compared against outflows
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />{" "}
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />{" "}
              Expense
            </span>
          </div>
        </div>

        {isFlowChartInitialLoading ? (
          <BarChartSkeleton />
        ) : incomeVsExpense.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No chart data available for the selected range.
          </div>
        ) : (
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 overflow-x-auto">
            {incomeVsExpense.map((item) => {
              const maxVal = Math.max(
                ...incomeVsExpense.map((i) =>
                  Math.max(i.totalIncome, i.totalExpense),
                ),
                100,
              );
              const incomeHeight = (item.totalIncome / maxVal) * 100;
              const expenseHeight = (item.totalExpense / maxVal) * 100;

              return (
                <div
                  key={item.date.toString()}
                  className="flex-1 min-w-12.5 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-48">
                    <div
                      className="w-4 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-lg transition-all duration-300 relative"
                      style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-emerald-300 font-bold px-1.5 py-0.5 rounded shadow pointer-events-none z-10 whitespace-nowrap border border-slate-800">
                        +${item.totalIncome.toFixed(2)}
                      </div>
                    </div>
                    <div
                      className="w-4 bg-rose-500/80 hover:bg-rose-400 rounded-t-lg transition-all duration-300 relative"
                      style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-rose-300 font-bold px-1.5 py-0.5 rounded shadow pointer-events-none z-10 whitespace-nowrap border border-slate-800">
                        -${item.totalExpense.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tracking-tighter">
                    {formatBucketLabel(item.date.toString(), range)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Budget Breakdown & Daily Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget Breakdown — all-time, not tied to range selector */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Budget Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              All-time share of spending per budget
            </p>
          </div>

          {isBreakdownInitialLoading ? (
            <BarListSkeleton rows={5} />
          ) : expenseBreakdown.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No breakdown data logged yet.
            </div>
          ) : (
            <div className="space-y-4">
              {expenseBreakdown.map((budget) => {
                const percent = budget.limitAmount
                  ? (budget.totalSpent / budget.limitAmount) * 100
                  : 0;
                return (
                  <div key={budget.budgetId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        {budget.budgetName}
                      </span>
                      <span className="font-bold text-slate-100">
                        ${budget.totalSpent.toFixed(2)} ({percent.toFixed(2)}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Cash Flow — income + expense per day */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Daily Cash Flow
            </h2>
            <p className="text-xs text-slate-400">
              Income and expense activity per day
            </p>
          </div>

          {isTrendInitialLoading ? (
            <RowListSkeleton rows={6} />
          ) : spendingTrend.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No trend data available.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {spendingTrend.map((item) => (
                <div
                  key={item.date}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {formatBucketLabel(item.date, range)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.expenseCount} expense(s) · {item.incomeCount}{" "}
                      income(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-400">
                      +${item.totalIncome.toFixed(2)}
                    </span>
                    <span className="text-rose-400">
                      -${item.totalExpense.toFixed(2)}
                    </span>
                    <span
                      className={
                        item.netSavings >= 0
                          ? "text-teal-300"
                          : "text-amber-400"
                      }
                    >
                      {item.netSavings >= 0 ? "+" : ""}$
                      {item.netSavings.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown — all-time */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Spending by Payment Method
          </h2>
          <p className="text-xs text-slate-400">
            All-time breakdown of how you pay
          </p>
        </div>

        {isPaymentMethodInitialLoading ? (
          <PaymentMethodGridSkeleton />
        ) : expenseByPaymentMethod.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No payment method data available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expenseByPaymentMethod.map((pm) => {
              const percent = totalSpentByPaymentMethod
                ? (pm.totalAmount / totalSpentByPaymentMethod) * 100
                : 0;
              return (
                <div
                  key={pm.paymentMethod}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {PAYMENT_METHOD_LABELS[pm.paymentMethod] ??
                        pm.paymentMethod}
                    </span>
                    <span className="font-bold text-slate-100">
                      ${pm.totalAmount.toFixed(2)} ({percent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {pm.count} transaction(s)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
