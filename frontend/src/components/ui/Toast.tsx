"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuthError, clearAuthSuccess } from "@/store/slices/authSlice";
import { clearFinanceError, clearFinanceSuccess } from "@/store/slices/financeSlice";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function Toast() {
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);
  const authSuccess = useAppSelector((state) => state.auth.successMessage);
  const financeError = useAppSelector((state) => state.finance.error);
  const financeSuccess = useAppSelector((state) => state.finance.successMessage);

  const error = authError || financeError;
  const success = authSuccess || financeSuccess;

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearAuthError());
        dispatch(clearAuthSuccess());
        dispatch(clearFinanceError());
        dispatch(clearFinanceSuccess());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  if (!error && !success) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5">
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => {
              dispatch(clearAuthError());
              dispatch(clearFinanceError());
            }}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button
            onClick={() => {
              dispatch(clearAuthSuccess());
              dispatch(clearFinanceSuccess());
            }}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
