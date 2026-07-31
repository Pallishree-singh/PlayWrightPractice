import type { Metadata } from "next";
import "./globals.css";
import { DashboardNav } from "@/components/dashboard/nav";

export const metadata: Metadata = {
  title: "contentForge",
  description: "AI Content Automation Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
          <header className="mb-6 rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">contentForge</h1>
            <p className="mt-2 text-slate-600">AI-powered LinkedIn content automation for QA and agentic AI teams.</p>
            <div className="mt-4">
              <DashboardNav />
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
