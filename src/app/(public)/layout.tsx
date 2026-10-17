import type { ReactNode } from "react";
import { PublicHeader } from "@/features/shell/PublicHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
    </>
  );
}
