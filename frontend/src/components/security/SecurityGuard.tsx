"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { Loader2 } from "lucide-react";

export const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const isRedirectedRoute =
    (isAuthenticated && isPublicRoute) || (!isAuthenticated && !isPublicRoute);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.push("/login");
      } else if (isAuthenticated && isPublicRoute) {
        router.push("/");
      }
    }
  }, [isAuthenticated, loading, isPublicRoute, pathname, router]);

  if (loading || isRedirectedRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 bg-slate-900/80 border border-emerald-500/20 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200 text-sm">
              Expense Tracker
            </span>
            <span className="text-xs text-slate-400">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
