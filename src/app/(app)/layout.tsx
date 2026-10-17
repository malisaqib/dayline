import type { ReactNode } from "react";
import { PageMain } from "@/features/shell/PageMain";
import { SiteHeader } from "@/features/shell/SiteHeader";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageMain>{children}</PageMain>
    </>
  );
}
