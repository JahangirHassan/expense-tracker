"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchBudgetsThunk,
  fetchExpensesThunk,
  deleteBudgetThunk,
  createBudgetThunk,
  updateBudgetThunk,
} from "@/store/slices/financeSlice";
import { budgetSchema, BudgetFormData } from "@/lib/validation/finance.schema";
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  RotateCcw,
  Search,
  Filter,
  Edit,
  Loader2,
  Eye,
  Receipt,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { BudgetPeriod, IBudget } from "@/types";

const getDefaultFormData = (): BudgetFormData => ({
  name: "",
  limitAmount: 0,
  period: "monthly",
  description: "",
  rollover: false,
  startDate: new Date().toISOString().split("T")[0],
});

const BudgetCardSkeleton = () => {
  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-20 bg-slate-800 rounded" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-3.5 w-24 bg-slate-800 rounded" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-slate-800 rounded-lg" />
          <div className="h-8 w-8 bg-slate-800 rounded-lg" />
        </div>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full" />
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-800 rounded" />
        <div className="h-3 w-20 bg-slate-800 rounded" />
      </div>
    </div>
  );
};

const getStatusColorClass = (status: "green" | "yellow" | "red") => {
  switch (status) {
    case "green":
      return "from-emerald-500 to-teal-400";
    case "yellow":
      return "from-amber-500 to-yellow-400";
    case "red":
      return "from-rose-500 to-red-400";
  }
};

const getStatusBadgeClass = (status: "green" | "yellow" | "red") => {
  switch (status) {
    case "green":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "yellow":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "red":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
};

const BudgetsPage = () => {
  const dispatch = useAppDispatch();
  const { budgets, expenses, loading } = useAppSelector(
    (state) => state.finance,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [viewingBudget, setViewingBudget] = useState<IBudget | null>(null); // ✅ details popup state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const [formData, setFormData] =
    useState<BudgetFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBudgetName, setFilterBudgetName] = useState("");

  useEffect(() => {
    dispatch(fetchBudgetsThunk()).finally(() => setHasFetchedOnce(true));
    dispatch(fetchExpensesThunk()); // ✅ details popup ke liye expenses bhi chahiye
  }, [dispatch]);

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setEditingBudgetId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget: IBudget) => {
    setEditingBudgetId(budget._id);
    setFormData({
      name: budget.name,
      limitAmount: budget.limitAmount,
      period: budget.period as BudgetPeriod,
      description: budget.description ?? "",
      rollover: budget.rollover,
      startDate: budget.startDate
        ? new Date(budget.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    resetForm();
  };

  const handleCloseModalForce = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});

    const result = budgetSchema.safeParse({
      ...formData,
      limitAmount: Number(formData.limitAmount),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudgetId) {
        // Convert the BudgetFormData object into a FormData instance expected by the thunk
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("limitAmount", String(formData.limitAmount));
        payload.append("period", String(formData.period));
        payload.append("rollover", String(formData.rollover));
        if (formData.description)
          payload.append("description", formData.description);
        if (formData.startDate) payload.append("startDate", formData.startDate);
        const res = await dispatch(
          updateBudgetThunk({ budgetId: editingBudgetId, formData: payload }),
        );
        if (updateBudgetThunk.fulfilled.match(res)) {
          handleCloseModalForce();
        } else if (updateBudgetThunk.rejected.match(res)) {
          setErrors({ form: String(res.payload ?? "Failed to update budget") });
        }
        return;
      }

      const res = await dispatch(createBudgetThunk(result.data));
      if (createBudgetThunk.fulfilled.match(res)) {
        handleCloseModalForce();
      } else if (createBudgetThunk.rejected.match(res)) {
        setErrors({ form: String(res.payload ?? "Failed to create budget") });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteBudgetId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await dispatch(deleteBudgetThunk(deleteBudgetId));
      if (deleteBudgetThunk.fulfilled.match(res)) {
        setDeleteBudgetId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" || budget.name.toLowerCase().includes(query);

    const matchesFilter =
      filterBudgetName === "" || budget.name === filterBudgetName;

    return matchesSearch && matchesFilter;
  });

  const isInitialLoading = loading && !hasFetchedOnce;
  const isBackgroundRefreshing = loading && hasFetchedOnce;

  // ✅ Details popup ke liye — us budget se linked expenses aur stats
  const viewingBudgetExpenses = viewingBudget
    ? expenses
        .filter((exp) => exp.budget?._id === viewingBudget._id)
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const avgPerExpense =
    viewingBudget && viewingBudgetExpenses.length > 0
      ? (viewingBudget.spentAmount ?? 0) / viewingBudgetExpenses.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-400" />
            Budget Planner & Alerts
            {isBackgroundRefreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            )}
          </h1>
          <p className="text-xs text-slate-400">
            Set weekly or monthly spending caps per category with automated
            rollover calculation
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={isInitialLoading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 text-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Budget</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search budget name..."
            value={searchQuery}
            disabled={isInitialLoading}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterBudgetName}
            disabled={isInitialLoading}
            onChange={(e) => setFilterBudgetName(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="">All Budgets</option>
            {budgets.map((item) => (
              <option key={item._id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 text-sm rounded-3xl border border-slate-800">
          No budget limits set yet. Click &quot;Set New Budget&quot; to create
          spending rules.
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 text-sm rounded-3xl border border-slate-800">
          No budgets match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBudgets.map((item) => {
            const colorClass = getStatusColorClass(item.status);
            const clampedPercent = Math.min(item.percentageUsed ?? 0, 100);
            const isThisRowDeleting = isDeleting && deleteBudgetId === item._id;

            return (
              <div
                key={item._id}
                className={`glass-card p-6 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden transition-opacity ${
                  isThisRowDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      {item.period} limit
                    </span>
                    <h3 className="font-bold text-slate-100 text-base mt-0.5">
                      {item.name}
                    </h3>
                    <p className="text-sm font-semibold text-slate-300 mt-0.5">
                      Limit: ${item.limitAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      disabled={isDeleting}
                      className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit Budget"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBudgetId(item._id)}
                      disabled={isDeleting}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Budget"
                    >
                      {isThisRowDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {item.alert && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                      item.status === "red"
                        ? "bg-rose-950/60 border border-rose-500/40 text-rose-300"
                        : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {item.message ??
                        `You've used ${item.percentageUsed?.toFixed(
                          0,
                        )}% of your "${item.name}" budget`}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Spent: ${item.spentAmount?.toFixed(2)}
                    </span>
                    <span className="font-bold text-slate-200">
                      {item.percentageUsed?.toFixed(2)}% used
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full bg-linear-to-r ${colorClass} transition-all duration-500 rounded-full`}
                      style={{ width: `${clampedPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    Rollover: {item.rollover ? "Enabled" : "Disabled"}
                  </span>
                  <span>
                    Remaining:{" "}
                    <strong
                      className={
                        (item.remainingAmount ?? 0 >= 0)
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      ${(item.remainingAmount ?? 0).toFixed(2)}
                    </strong>
                  </span>
                </div>

                {/* ✅ See Details button — isi component ke andar popup kholega */}
                <button
                  type="button"
                  onClick={() => setViewingBudget(item)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  See Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingBudgetId
                  ? "Edit Budget Limit"
                  : "Configure Budget Limit"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <fieldset disabled={isSubmitting} className="contents">
              <form onSubmit={handleSaveBudget} className="space-y-4">
                {errors.form && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                    {errors.form}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Groceries, Rent, Entertainment..."
                    value={formData.name}
                    maxLength={100}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Spending Limit ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="500.00"
                      value={formData.limitAmount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limitAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    {errors.limitAmount && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {errors.limitAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tracking Period *
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          period: e.target.value as BudgetPeriod,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    {errors.period && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {errors.period}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date Anchor
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {errors.startDate && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {errors.description && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">
                      Rollover Unused Budget?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Carries forward remaining budget to the next period
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.rollover}
                    onChange={(e) =>
                      setFormData({ ...formData, rollover: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center just ify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting
                    ? editingBudgetId
                      ? "Updating..."
                      : "Saving..."
                    : editingBudgetId
                      ? "Update Budget Rule"
                      : "Save Budget Rule"}
                </button>
              </form>
            </fieldset>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteBudgetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => !isDeleting && setDeleteBudgetId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <Trash2 className="h-7 w-7 text-rose-400" />
              </div>
            </div>

            <h2 className="text-center text-lg font-bold text-white">
              Delete Budget?
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              This will permanently remove this budget rule. Existing expenses
              linked to it won&apos;t be deleted, but they will lose their
              budget association.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteBudgetId(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Budget Details Popup — isi file ke andar */}
      {viewingBudget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setViewingBudget(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {viewingBudget.name}
                  </h2>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                      viewingBudget.status,
                    )}`}
                  >
                    {viewingBudget.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {viewingBudget.period} budget
                  {viewingBudget.rollover ? " · Rollover enabled" : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingBudget(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Spent ${viewingBudget.spentAmount?.toFixed(2)} of $
                    {viewingBudget.limitAmount.toFixed(2)}
                  </span>
                  <span className="font-bold text-slate-200">
                    {viewingBudget.percentageUsed?.toFixed(0)}% used
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full bg-linear-to-r ${getStatusColorClass(
                      viewingBudget.status,
                    )} transition-all duration-500 rounded-full`}
                    style={{
                      width: `${Math.min(viewingBudget.percentageUsed ?? 0, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[11px] text-slate-500">Total Expenses</p>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">
                    {viewingBudgetExpenses.length}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[11px] text-slate-500">Avg / Expense</p>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">
                    ${avgPerExpense.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    {(viewingBudget.remainingAmount ?? 0) >= 0 ? (
                      <TrendingDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-rose-400" />
                    )}
                    Remaining
                  </p>
                  <p
                    className={`text-lg font-bold mt-0.5 ${
                      (viewingBudget.remainingAmount ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    ${(viewingBudget.remainingAmount ?? 0).toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[11px] text-slate-500">Limit</p>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">
                    ${viewingBudget.limitAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Expense list */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Expenses in this budget
                </h3>

                {viewingBudgetExpenses.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
                    No expenses logged against this budget yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingBudgetExpenses.map((exp) => (
                      <div
                        key={exp._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-200 truncate">
                              {exp.notes || "No notes"}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(exp.date).toLocaleDateString()}
                              </span>
                              <span className="uppercase font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {exp.paymentMethod.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="font-bold text-slate-100 text-sm shrink-0 ml-3">
                          -${exp.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default  BudgetsPage;