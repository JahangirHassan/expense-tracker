"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchExpensesThunk,
  fetchIncomesThunk,
  fetchBudgetsThunk,
  fetchExpenseBreakdownThunk,
} from "@/store/slices/financeSlice";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PieChart,
  Scan,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

// ---- Skeleton components ----

function KpiCardSkeleton() {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800/80 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-24 bg-slate-800 rounded" />
        <div className="w-9 h-9 rounded-xl bg-slate-800" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-6 w-28 bg-slate-800 rounded" />
        <div className="h-2.5 w-20 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-800 rounded" />
          <div className="h-2.5 w-20 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-3.5 w-16 bg-slate-800 rounded" />
    </div>
  );
}

function BreakdownRowSkeleton() {
  return (
    <div className="space-y-1.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-slate-800 rounded" />
        <div className="h-3 w-14 bg-slate-800 rounded" />
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full" />
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const {
    expenses,
    budgets,
    expensesTotal,
    incomes,
    expenseBreakdown,
    loading, // ✅ single source of truth for loading — Redux-owned
  } = useAppSelector((state) => state.finance);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExpensesThunk());
    dispatch(fetchIncomesThunk());
    dispatch(fetchBudgetsThunk());
    dispatch(fetchExpenseBreakdownThunk());
  }, [dispatch]);

  const totalExpense = expensesTotal || 0;
  // incomesTotal doesn't exist on FinanceState yet — deriving it client-side
  // from the loaded incomes list until a backend summary field is added.
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netSavings = totalIncome - totalExpense;

  // `loading` is a single shared flag across all finance thunks, so on
  // first mount every section shows its skeleton together; once any data
  // has arrived, we stop showing skeletons and rely on individual
  // empty-state messages instead of re-skeletoning on every background
  // refetch (e.g. after adding an expense elsewhere).
  const hasAnyData =
    expenses.length > 0 ||
    incomes.length > 0 ||
    budgets.length > 0 ||
    expenseBreakdown.length > 0;
  const isInitialLoading = loading && !hasAnyData;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 lg:p-8 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0] || "Tracker"}! 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Here is your financial health breakdown for this month. Scan
            receipts, track recurring items, and monitor active budget limits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            href="/expenses"
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
          <Link
            href="/ocr"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl transition-all text-xs"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Receipt</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Expenses */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                $
                {totalExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <p className="text-xs text-slate-500 mt-1">Logged this period</p>
            </div>
          </div>

          {/* Total Income */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Income
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                $
                {totalIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <p className="text-xs text-slate-500 mt-1">Recorded earnings</p>
            </div>
          </div>

          {/* Net Savings */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Net Balance
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  netSavings >= 0
                    ? "bg-teal-500/10 text-teal-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold ${
                  netSavings >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                $
                {netSavings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {netSavings >= 0 ? "Surplus remaining" : "Deficit Warning"}
              </p>
            </div>
          </div>

          {/* Active Budgets */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Budgets
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {budgets.length}
              </span>
              <p className="text-xs text-slate-500 mt-1">Tracked limits</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Recent Expenses & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-400">
                Latest expenses logged in your account
              </p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isInitialLoading ? (
            <div className="space-y-3">
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No expenses logged yet. Click &quot;Add Expense&quot; or
              &quot;Scan Receipt&quot; to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((exp) => (
                <div
                  key={exp._id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold">
                      💸
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-200 block">
                        {exp.budget?.name ?? "General Expense"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(exp.date).toLocaleDateString()} ·{" "}
                        {exp.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-100 text-sm">
                    -${exp.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Spending Categories Widget (1 col) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Expense Breakdown</h2>
            <p className="text-xs text-slate-400">
              Top budgets by all-time spend
            </p>
          </div>

          {isInitialLoading ? (
            <div className="space-y-4">
              <BreakdownRowSkeleton />
              <BreakdownRowSkeleton />
              <BreakdownRowSkeleton />
              <BreakdownRowSkeleton />
            </div>
          ) : expenseBreakdown.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No breakdown data available yet.
            </div>
          ) : (
            <div className="space-y-4">
              {expenseBreakdown.slice(0, 4).map((item) => {
                const breakdownTotal = expenseBreakdown.reduce(
                  (sum, b) => sum + b.totalSpent,
                  0,
                );
                const percent = breakdownTotal
                  ? (item.totalSpent / breakdownTotal) * 100
                  : 0;
                return (
                  <div key={item.budgetId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">
                        {item.budgetName}
                      </span>
                      <span className="font-bold text-slate-200">
                        ${item.totalSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-center">
            <Link
              href="/analytics"
              className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>Explore Analytics & Charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
