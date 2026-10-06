"use client";

import React, { useState, useEffect, SubmitEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchExpensesThunk,
  createExpenseThunk,
  deleteExpenseThunk,
  updateExpenseThunk,
} from "@/store/slices/financeSlice";
import {
  expenseSchema,
  ExpenseFormData,
} from "@/lib/validation/finance.schema";
import {
  Plus,
  Search,
  Trash2,
  Receipt as ReceiptIcon,
  X,
  Loader2,
  Calendar,
  Edit,
  FileText,
  Filter,
} from "lucide-react";
import { PaymentMethod, RecurrenceInterval, IExpense } from "@/types";

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const { expenses, budgets, loading } = useAppSelector(
    (state) => state.finance,
  );

  const [selectedExpense, setSelectedExpense] = useState<IExpense | null>(null);

  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const [formData, setFormData] = useState<ExpenseFormData>({
    budget: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "card",
    notes: "",
    isRecurring: false,
    recurrenceInterval: undefined,
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    dispatch(fetchExpensesThunk());
  }, [dispatch]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setErrors({});
  };
  const isEditChanged =
    editingExpense !== null &&
    (formData.amount !== editingExpense.amount ||
      formData.date !==
        new Date(editingExpense.date).toISOString().split("T")[0] ||
      formData.paymentMethod !== editingExpense.paymentMethod ||
      formData.notes !== (editingExpense.notes || "") ||
      formData.isRecurring !== editingExpense.isRecurring ||
      formData.recurrenceInterval !== editingExpense.recurrenceInterval);

  const handleCreateAndUpdateExpense = async (
    e: SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setErrors({});

    const result = expenseSchema.safeParse({
      ...formData,
      amount: Number(formData.amount),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const payload = new FormData();
    payload.append("budget", formData.budget);
    payload.append("amount", String(formData.amount));
    payload.append("paymentMethod", formData.paymentMethod);
    if (formData.date) payload.append("date", formData.date);
    if (formData.notes) payload.append("notes", formData.notes);
    if (formData.isRecurring) {
      payload.append("isRecurring", "true");
      if (formData.recurrenceInterval) {
        payload.append("recurrenceInterval", formData.recurrenceInterval);
      }
    }
    if (receiptFile) {
      payload.append("receipt", receiptFile);
    }
    if (editingExpense?._id) {
      const res = await dispatch(
        updateExpenseThunk({
          expenseId: editingExpense._id,
          formData: payload,
        }),
      );
      if (updateExpenseThunk.fulfilled.match(res)) {
        setIsModalOpen(false);
        setFormData({
          budget: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          paymentMethod: "card",
          notes: "",
          isRecurring: false,
          recurrenceInterval: undefined,
        });
        setReceiptFile(null);
        setEditingExpense(null);
      }
      return;
    }
    const res = await dispatch(createExpenseThunk(payload));

    if (createExpenseThunk.fulfilled.match(res)) {
      setIsModalOpen(false);
      setFormData({
        budget: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "card",
        notes: "",
        isRecurring: false,
        recurrenceInterval: undefined,
      });
      setReceiptFile(null);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      exp.budget?.name?.toLowerCase().includes(query) ||
      exp.notes?.toLowerCase().includes(query) ||
      exp.amount.toString().includes(query);

    const matchesPayment = filterPayment
      ? exp.paymentMethod === filterPayment
      : true;

    return matchesSearch && matchesPayment;
  });

  return (
    //use loading state

    <div className="space-y-6">
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ReceiptIcon className="w-6 h-6 text-emerald-400" />
            Expense Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Log and manage all your personal and business expenditures
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 text-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search category, notes, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="">All Payment Methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
      </div>

      {/* Expense Items List */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No expense entries found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredExpenses.map((exp) => (
              <div
                key={exp._id}
                onClick={() => setSelectedExpense(exp)}
                className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors cursor-pointer"
              >
                {/* LEFT SIDE */}
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
                    💸
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200 text-sm truncate">
                        {exp.notes || "No expense notes"}
                      </span>

                      {exp.isRecurring && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase font-mono">
                          {exp.recurrenceInterval}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(exp.date).toLocaleDateString()}
                      </span>

                      <span className="uppercase font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {exp.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center space-x-4 ml-4">
                  {exp.receiptUrl && (
                    <FileText className="w-4 h-4 text-emerald-400" />
                  )}

                  <span className="font-extrabold text-slate-100 text-base whitespace-nowrap">
                    -${exp.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedExpense(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Expense Details
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Expense ID: {selectedExpense._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AMOUNT */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">Amount</p>

              <p className="text-3xl font-extrabold text-white mt-1">
                ${selectedExpense.amount.toFixed(2)}
              </p>
            </div>

            {/* DETAILS */}
            <div className="mt-6 space-y-3">
              {/* budget name */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Budget Name</span>

                <span className="text-sm text-slate-200">
                  {selectedExpense.budget?.name || "No budget"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Date</span>

                <span className="text-sm text-slate-200">
                  {new Date(selectedExpense.date).toLocaleDateString()}
                </span>
              </div>

              {/* Payment */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Payment Method</span>

                <span className="text-sm text-slate-200 capitalize">
                  {selectedExpense.paymentMethod.replace("_", " ")}
                </span>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-500">Notes</p>

                <p className="text-sm text-slate-200 mt-1">
                  {selectedExpense.notes || "No notes added"}
                </p>
              </div>

              {/* Recurring */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Recurring</span>

                <span className="text-sm text-slate-200">
                  {selectedExpense.isRecurring
                    ? selectedExpense.recurrenceInterval
                    : "No"}
                </span>
              </div>

              {/* Receipt */}
              {selectedExpense.receiptUrl && (
                <a
                  href={selectedExpense.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20"
                >
                  <FileText className="w-4 h-4" />
                  View Receipt
                </a>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mt-6">
              {/* EDIT */}
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(selectedExpense);
                  setFormData({
                    amount: selectedExpense.amount,
                    budget: selectedExpense.budget?._id,
                    date: new Date(selectedExpense.date)
                      .toISOString()
                      .split("T")[0],
                    paymentMethod: selectedExpense.paymentMethod,
                    notes: selectedExpense.notes || "",
                    isRecurring: selectedExpense.isRecurring,
                    recurrenceInterval: selectedExpense.recurrenceInterval,
                  });
                  setSelectedExpense(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>

              {/* DELETE */}
              <button
                type="button"
                onClick={() => {
                  setDeleteExpenseId(selectedExpense._id);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white hover:bg-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteExpenseId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setDeleteExpenseId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <Trash2 className="h-7 w-7 text-rose-400" />
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-center text-lg font-bold text-white">
              Delete Expense?
            </h2>

            {/* MESSAGE */}
            <p className="mt-2 text-center text-sm text-slate-400">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>

            {/* BUTTONS */}
            <div className="mt-6 flex gap-3">
              {/* NO */}
              <button
                type="button"
                onClick={() => setDeleteExpenseId(null)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700"
              >
                No
              </button>

              {/* YES */}
              <button
                type="button"
                onClick={async () => {
                  const result = await dispatch(
                    deleteExpenseThunk(deleteExpenseId),
                  );

                  if (deleteExpenseThunk.fulfilled.match(result)) {
                    setDeleteExpenseId(null);
                    setSelectedExpense(null);
                  }
                }}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-400"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Expense</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update your expense information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <div className="mt-6 space-y-4">
              <form
                onSubmit={handleCreateAndUpdateExpense}
                className="space-y-4"
              >
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Budget Names *
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Budget</option>
                    {budgets.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.budget && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.budget}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>

                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  {errors.date && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method
                  </label>

                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as
                          | "cash"
                          | "card"
                          | "bank_transfer"
                          | "wallet",
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="wallet">Wallet</option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes
                  </label>

                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none"
                  />
                  {errors.notes && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.notes}
                    </p>
                  )}
                </div>

                {/* Recurring */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm font-semibold text-slate-300">
                    Recurring Expense
                  </span>

                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecurring: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  {errors.isRecurring && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.isRecurring}
                    </p>
                  )}
                </div>

                {/* Recurrence */}
                {formData.isRecurring && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Recurrence Interval
                    </label>

                    <select
                      value={formData.recurrenceInterval || "monthly"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrenceInterval: e.target.value as
                            | "daily"
                            | "weekly"
                            | "monthly"
                            | "yearly",
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    {errors.recurrenceInterval && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {errors.recurrenceInterval}
                      </p>
                    )}
                  </div>
                )}

                {/* BUTTONS */}
                <div className="flex gap-3 mt-6">
                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  {/* Save Edit */}
                  <button
                    type="submit"
                    disabled={!isEditChanged}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isEditChanged
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    Save Edit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Modal Dialog for Adding Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Log New Expense</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndUpdateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Budget Names *
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Budget</option>
                    {budgets.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.budget && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.budget}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target
                          .value as unknown as PaymentMethod,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Grocery store purchase, team lunch..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Receipt File */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Receipt Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setReceiptFile(e.target.files[0]);
                  }}
                  className="text-xs text-slate-400 file:bg-slate-900 file:border file:border-slate-800 file:text-emerald-400 file:px-3 file:py-1 file:rounded-xl cursor-pointer"
                />
              </div>

              {/* Recurring Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                  Is Recurring Expense?
                </span>
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData({ ...formData, isRecurring: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recurrence Interval *
                  </label>
                  <select
                    value={formData.recurrenceInterval || "monthly"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceInterval: e.target
                          .value as unknown as RecurrenceInterval,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs"
              >
                Save Expense Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
