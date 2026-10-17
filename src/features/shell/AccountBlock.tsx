import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";

export async function AccountBlock() {
  const reader = await getVerifiedReader(await createReaderSupabase());
  if (!reader || reader.isAnonymous) {
    return (
      <Link href="/signin" className={ui.primaryButton}>
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-48 truncate text-[13px] text-muted xl:inline" title={reader.email ?? undefined}>
        {reader.email}
      </span>
      <SignOutButton className={ui.secondaryButton} />
    </div>
  );
}
