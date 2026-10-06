import type { Metadata } from "next";
import "./globals.css";
import { ProviderWrapper } from "@/store/ProviderWrapper";
import { SecurityGuard } from "@/components/security/SecurityGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description:
    "AI-Powered Expense & Budget Tracker built with Next.js, Redux Toolkit, Axios, Zod & JWT Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <ProviderWrapper>
          <SecurityGuard>
            <Navbar />
            <div className="flex flex-1 min-h-[calc(100vh-65px)]">
              <Sidebar />
              <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {children}
              </main>
            </div>
            <Toast />
          </SecurityGuard>
        </ProviderWrapper>
      </body>
    </html>
  );
}
