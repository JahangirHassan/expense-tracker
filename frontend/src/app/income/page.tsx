"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchIncomesThunk,
  createIncomeThunk,
  deleteIncomeThunk,
  updateIncomeThunk,
} from "@/store/slices/financeSlice";
import { incomeSchema, IncomeFormData } from "@/lib/validation/finance.schema";
import {
  Plus,
  Wallet,
  Trash2,
  Calendar,
  X,
  Search,
  Building2,
  Briefcase,
  Gift,
  Coins,
  Filter,
  HelpCircle,
  Edit,
  Notebook,
} from "lucide-react";
import type { IIncome, IncomeSource, RecurrenceInterval } from "@/types";
import { string } from "zod/v4";

export default function IncomePage() {
  const dispatch = useAppDispatch();
  const { incomes } = useAppSelector((state) => state.finance);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncome, setSelectedIncome] = useState<IIncome | null>(null);
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState<IIncome | null>(null);

  const [filterSource, setFilterSource] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: 0,
    source: "salary",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    isRecurring: false,
    recurrenceInterval: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchIncomesThunk());
  }, [dispatch]);

  const handleCreateAndUpdateIncome = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setErrors({});

    const result = incomeSchema.safeParse({
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

    if (editingIncome?._id) {
      const res = await dispatch(
        updateIncomeThunk({
          incomeId: editingIncome._id,
          formData,
        }),
      );
      if (updateIncomeThunk.fulfilled.match(res)) {
        setEditingIncome(null);
        setFormData({
          amount: 0,
          source: "salary",
          date: new Date().toISOString().split("T")[0],
          notes: "",
          isRecurring: false,
          recurrenceInterval: undefined,
        });
        setIsModalOpen(false);
      }
      return;
    }

    const res = await dispatch(createIncomeThunk(formData));
    if (createIncomeThunk.fulfilled.match(res)) {
      setIsModalOpen(false);
      setFormData({
        amount: 0,
        source: "salary",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        isRecurring: false,
        recurrenceInterval: undefined,
      });
    }
  };

  const filteredIncomes = incomes.filter((inc) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inc.source?.toLowerCase().includes(query) ||
      inc.notes?.toLowerCase().includes(query) ||
      inc.amount.toString().includes(query);

    const matchesSourse = filterSource ? inc.source === filterSource : true;

    return matchesSearch && matchesSourse;
  });

  const isEditChanged =
    editingIncome !== null &&
    (formData.amount !== editingIncome.amount ||
      formData.date !==
        new Date(editingIncome.date).toISOString().split("T")[0] ||
      formData.source !== editingIncome.source ||
      formData.notes !== (editingIncome.notes || "") ||
      formData.isRecurring !== editingIncome.isRecurring ||
      formData.recurrenceInterval !== editingIncome.recurrenceInterval);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "salary":
        return <Building2 className="w-5 h-5 text-emerald-400" />;
      case "freelance":
        return <Briefcase className="w-5 h-5 text-teal-400" />;
      case "gifts":
        return <Gift className="w-5 h-5 text-indigo-400" />;
      case "investments":
        return <Coins className="w-5 h-5 text-amber-400" />;
      case "other":
        return <Notebook className="w-5 h-5 text-slate-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            Income Manager
          </h1>
          <p className="text-xs text-slate-400">
            Record earnings, salary payments, freelance revenue, and investment
            returns
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 text-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Income</span>
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
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="">All Income Sources</option>
            <option value="investments">Investments</option>
            <option value="salary">Salary</option>
            <option value="freelance">Freelance</option>
            <option value="gifts">Gifts</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Income List */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {incomes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No income streams logged yet. Click `Add Income` to record your
            earnings.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredIncomes.map((inc) => (
              <div
                key={inc._id}
                onClick={() => setSelectedIncome(inc)}
                className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors cursor-pointer"
              >
                {/* LEFT SIDE */}
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
                    {getSourceIcon(inc.source)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200 text-sm truncate">
                        {inc.source || "No income notes"}
                      </span>

                      {inc.isRecurring && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase font-mono">
                          {inc.recurrenceInterval}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(inc.date).toLocaleDateString()}
                      </span>

                      {/* <span className="uppercase font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {exp.paymentMethod.replace("_", " ")}
                      </span> */}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center space-x-4 ml-4">
                  {/* {exp.receiptUrl && (
                    <FileText className="w-4 h-4 text-emerald-400" />
                  )} */}

                  <span className="font-extrabold text-slate-100 text-base whitespace-nowrap">
                    +${inc.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* select a single income */}
      {selectedIncome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedIncome(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Income Details</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Income ID: {selectedIncome._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncome(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AMOUNT */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">Amount</p>

              <p className="text-3xl font-extrabold text-white mt-1">
                ${selectedIncome.amount.toFixed(2)}
              </p>
            </div>

            {/* DETAILS */}
            <div className="mt-6 space-y-3">
              {/* budget name */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Source</span>

                <span className="text-sm text-slate-200">
                  {selectedIncome.source || "Other"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Date</span>

                <span className="text-sm text-slate-200">
                  {new Date(selectedIncome.date).toLocaleDateString()}
                </span>
              </div>

              {/* Source */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Source</span>

                <span className="text-sm text-slate-200 capitalize">
                  {selectedIncome.source}
                </span>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-500">Notes</p>

                <p className="text-sm text-slate-200 mt-1">
                  {selectedIncome.notes || "No notes added"}
                </p>
              </div>

              {/* Recurring */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500">Recurring</span>

                <span className="text-sm text-slate-200">
                  {selectedIncome.isRecurring
                    ? selectedIncome.recurrenceInterval
                    : "No"}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mt-6">
              {/* EDIT */}
              <button
                type="button"
                onClick={() => {
                  setEditingIncome(selectedIncome);
                  setFormData({
                    amount: selectedIncome.amount,
                    date: new Date(selectedIncome.date)
                      .toISOString()
                      .split("T")[0],
                    source: selectedIncome.source,
                    notes: selectedIncome.notes || "",
                    isRecurring: selectedIncome.isRecurring,
                    recurrenceInterval: selectedIncome.recurrenceInterval,
                  });
                  setSelectedIncome(null);
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
                  setDeleteIncomeId(selectedIncome._id);
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

      {/* Delete income by Id */}
      {deleteIncomeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setDeleteIncomeId(null)}
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
              Delete Income?
            </h2>

            {/* MESSAGE */}
            <p className="mt-2 text-center text-sm text-slate-400">
              Are you sure you want to delete this income? This action cannot be
              undone.
            </p>

            {/* BUTTONS */}
            <div className="mt-6 flex gap-3">
              {/* NO */}
              <button
                type="button"
                onClick={() => setDeleteIncomeId(null)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700"
              >
                No
              </button>

              {/* YES */}
              <button
                type="button"
                onClick={async () => {
                  const result = await dispatch(
                    deleteIncomeThunk(deleteIncomeId),
                  );

                  if (deleteIncomeThunk.fulfilled.match(result)) {
                    setDeleteIncomeId(null);
                    setSelectedIncome(null);
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

      {/* update income by id*/}
      {editingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Income</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update your income information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingIncome(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <div className="mt-6 space-y-4">
              <form
                onSubmit={handleCreateAndUpdateIncome}
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

                {/* source */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source: e.target.value as
                          | "investments"
                          | "salary"
                          | "freelance"
                          | "gifts"
                          | "other",
                      })
                    }
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">All Income Sources</option>
                    <option value="investments">Investments</option>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="gifts">Gifts</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.source && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.source}
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
                    Recurring Income
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
                    onClick={() => setEditingIncome(null)}
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                Record Income Entry
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndUpdateIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2500.00"
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

                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Income Source *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source: e.target.value as IncomeSource,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="gifts">Gifts</option>
                    <option value="investments">Investments</option>
                    <option value="other">Other</option>
                  </select>
                </div>
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

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Monthly paycheck, client retainer..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recurring Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                  Is Recurring Income?
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
                          .value as RecurrenceInterval,
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
                Save Income Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
