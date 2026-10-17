import type { ReactNode } from "react";

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      {children}
    </main>
  );
}
