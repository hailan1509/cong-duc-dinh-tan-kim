// Split-screen auth layout adapted from TailAdmin (MIT).
import type React from "react";
import { adminFont } from "./font";
import { IconTemple } from "./icons";
import { cn } from "./ui";

function GridShape({ className }: { className?: string }) {
  return (
    <svg className={className} width="450" height="254" viewBox="0 0 450 254" fill="none" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={`v${i}`} d={`M${0.5 + i * 50} 0V254`} stroke="currentColor" strokeOpacity="0.12" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={`h${i}`} d={`M0 ${0.5 + i * 50}H450`} stroke="currentColor" strokeOpacity="0.12" />
      ))}
      <rect x="100.5" y="50.5" width="49" height="49" fill="currentColor" fillOpacity="0.08" />
      <rect x="250.5" y="150.5" width="49" height="49" fill="currentColor" fillOpacity="0.08" />
      <rect x="350.5" y="0.5" width="49" height="49" fill="currentColor" fillOpacity="0.06" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(adminFont.variable, "relative min-h-dvh bg-white font-admin text-gray-800")}>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-gold-300 [&_svg]:size-6">
                <IconTemple />
              </span>
              <span className="leading-tight">
                <span className="block font-bold text-gray-900">Đình Tân Kim</span>
                <span className="block text-xs text-gray-500">Quản lý công đức</span>
              </span>
            </div>
            {children}
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-brand-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,215,0,0.18),transparent_55%),radial-gradient(circle_at_85%_90%,rgba(200,35,44,0.45),transparent_55%)]" />
          <GridShape className="absolute top-0 right-0 w-full max-w-[250px] text-gold-300 xl:max-w-[450px]" />
          <GridShape className="absolute bottom-0 left-0 w-full max-w-[250px] rotate-180 text-gold-300 xl:max-w-[450px]" />

          <div className="relative z-10 flex max-w-sm flex-col items-center px-6 text-center">
            <span className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-gold-400/30 bg-gradient-to-br from-brand-600 to-brand-800 text-gold-300 shadow-[0_20px_60px_rgba(0,0,0,0.35)] [&_svg]:size-11">
              <IconTemple />
            </span>
            <div className="text-xs font-semibold tracking-[0.25em] text-gold-300/80 uppercase">Hệ thống quản trị</div>
            <div className="mt-3 text-3xl leading-tight font-bold text-white">Công Đức Đình Làng Tân Kim</div>
            <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            <p className="mt-5 text-sm text-white/60">
              Ghi nhận công đức, quản lý ngày lễ và trình chiếu bảng vàng trực tiếp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
