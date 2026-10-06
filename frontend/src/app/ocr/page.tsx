"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  scanReceiptThunk,
  confirmReceiptThunk,
  resetScannedReceipt,
} from "@/store/slices/financeSlice";
import { receiptConfirmSchema } from "@/lib/validation/finance.schema";
import {
  Scan,
  UploadCloud,
  CheckCircle2,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Store,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { PaymentMethod } from "@/types";
import Image from "next/image";

export default function OCRPage() {
  const dispatch = useAppDispatch();
  const { lastScannedReceipt, ocrLoading } = useAppSelector(
    (state) => state.finance,
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Draft editing state for step 2
  const [confirmData, setConfirmData] = useState({
    amount: 0,
    category: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "card" as PaymentMethod,
    notes: "",
    merchantName: "",
    receiptUrl: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {}, [dispatch]);

  useEffect(() => {
    if (lastScannedReceipt) {
      setConfirmData({
        amount: lastScannedReceipt.parsed.total || 0,
        category: lastScannedReceipt.suggestedCategory.categoryId || "",
        date: lastScannedReceipt.parsed.date
          ? new Date(lastScannedReceipt.parsed.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        paymentMethod: "card",
        notes: `Receipt scan from ${lastScannedReceipt.parsed.merchantName || "Merchant"}`,
        merchantName: lastScannedReceipt.parsed.merchantName || "",
        receiptUrl: lastScannedReceipt.receiptUrl,
      });
    }
  }, [lastScannedReceipt]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;
    dispatch(scanReceiptThunk(selectedFile));
  };

  const handleConfirmExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = receiptConfirmSchema.safeParse({
      ...confirmData,
      amount: Number(confirmData.amount),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    const res = await dispatch(confirmReceiptThunk(confirmData));
    if (confirmReceiptThunk.fulfilled.match(res)) {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Scan className="w-6 h-6 text-emerald-400" />
          AI Receipt OCR Scanner
        </h1>
        <p className="text-xs text-slate-400">
          Upload receipt photos to automatically extract total cost, merchant
          name, line items, and smart categories
        </p>
      </div>

      {!lastScannedReceipt ? (
        /* STEP 1: Upload & Scan */
        <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">
              Upload Receipt Image
            </h2>
            <p className="text-xs text-slate-400">
              Supports PNG, JPG, JPEG, and WebP format (max 5MB)
            </p>
          </div>

          <div className="w-full relative group cursor-pointer">
            <div className="w-full h-48 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-950/60 hover:border-emerald-500 transition-colors">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  className="max-h-40 rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-500 space-y-2">
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Click to select or drag receipt photo here
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {selectedFile && (
            <button
              onClick={handleStartScan}
              disabled={ocrLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting Text with Tesseract OCR...</span>
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  <span>Run OCR Scan</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* STEP 2: Review Parsed OCR & Confirm Expense */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Scanned Image & Extracted Line Items */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Scanned Receipt Preview
              </h2>
              <button
                onClick={() => dispatch(resetScannedReceipt())}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Scan Another
              </button>
            </div>

            <Image
              src={lastScannedReceipt.receiptUrl}
              alt="Uploaded Receipt"
              className="w-full max-h-64 object-contain rounded-2xl bg-slate-950 border border-slate-800"
            />

            {/* Extracted Line Items */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Extracted Line Items
              </span>
              {lastScannedReceipt.parsed.lineItems.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No individual line items parsed.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {lastScannedReceipt.parsed.lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950 text-xs text-slate-300 border border-slate-800/60"
                    >
                      <span>{item.description}</span>
                      <span className="font-mono font-bold">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Confirmation Form */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verify & Confirm Expense
              </h2>
              <p className="text-xs text-slate-400">
                AI suggested category based on merchant name and line items
              </p>
            </div>

            <form onSubmit={handleConfirmExpense} className="space-y-4">
              {/* Merchant Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Merchant Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={confirmData.merchantName}
                    onChange={(e) =>
                      setConfirmData({
                        ...confirmData,
                        merchantName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Total Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={confirmData.amount}
                    onChange={(e) =>
                      setConfirmData({
                        ...confirmData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 font-bold"
                  />
                  {validationErrors.amount && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {validationErrors.amount}
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
                    value={confirmData.paymentMethod}
                    onChange={(e) =>
                      setConfirmData({
                        ...confirmData,
                        paymentMethod: e.target.value as PaymentMethod,
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
                    value={confirmData.date}
                    onChange={(e) =>
                      setConfirmData({ ...confirmData, date: e.target.value })
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
                  value={confirmData.notes}
                  onChange={(e) =>
                    setConfirmData({ ...confirmData, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Log Expense</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
