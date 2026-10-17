import type { ReactNode } from "react";
import { EDITION_TIMEZONE, formatEditionDate, localEditionDate } from "@/domain/editions/edition";
import { AccountBlock } from "@/features/shell/AccountBlock";
import { PageMain } from "@/features/shell/PageMain";
import { SiteFooter } from "@/features/shell/SiteFooter";
import { MobileNav, SidebarNav } from "@/features/shell/SidebarNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  const dateLabel = `${formatEditionDate(localEditionDate(new Date()))} · ${EDITION_TIMEZONE}`;
  return (
    <>
      <SidebarNav account={<AccountBlock />} dateLabel={dateLabel} />
      <MobileNav account={<AccountBlock />} dateLabel={dateLabel} />
      <div className="flex flex-1 flex-col lg:pl-[232px]">
        <PageMain>{children}</PageMain>
        <SiteFooter />
      </div>
    </>
  );
}
