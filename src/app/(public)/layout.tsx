import type { ReactNode } from "react";
import { PublicHeader } from "@/features/shell/PublicHeader";
import { SiteFooter } from "@/features/shell/SiteFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <SiteFooter />
    </>
  );
}
