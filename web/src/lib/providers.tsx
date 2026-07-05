"use client";

import dynamic from "next/dynamic";

const ProvidersInner = dynamic(
  () => import("./providers-inner"),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProvidersInner>{children}</ProvidersInner>;
}
