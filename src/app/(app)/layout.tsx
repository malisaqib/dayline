import type { ReactNode } from "react";
import { AppHeader } from "@/features/shell/AppHeader";
import { PageMain } from "@/features/shell/PageMain";
import { SiteFooter } from "@/features/shell/SiteFooter";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <PageMain>{children}</PageMain>
      <SiteFooter />
    </>
  );
}
