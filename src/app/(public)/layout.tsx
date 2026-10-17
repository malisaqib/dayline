import type { ReactNode } from "react";
import { PageMain } from "@/features/shell/PageMain";
import { PublicHeader } from "@/features/shell/PublicHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <PageMain>{children}</PageMain>
    </>
  );
}
