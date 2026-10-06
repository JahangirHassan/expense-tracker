"use client";

import React from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutUserThunk } from "@/store/slices/authSlice";
import { LogOut, Scan, User as UserIcon } from "lucide-react";

export function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUserThunk());
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            $
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-linear-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              Expense Tracker
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-3 lg:space-x-5">
        {/* Quick OCR Scanner CTA */}
        <Link
          href="/ocr"
          className="flex items-center space-x-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs lg:text-sm font-medium px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <Scan className="w-4 h-4 animate-pulse" />
          <span>Scan Receipt</span>
        </Link>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <Link
              href="/settings"
              className="flex items-center space-x-2 group"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold border border-slate-700">
                  {user.fullName ? (
                    user.fullName[0].toUpperCase()
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {user.fullName}
                </span>
                <span className="text-xs text-slate-400">@{user.userName}</span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout session"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
