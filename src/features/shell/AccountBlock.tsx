import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";

export async function AccountBlock() {
  const reader = await getVerifiedReader(await createReaderSupabase());
  if (!reader || reader.isAnonymous) {
    return (
      <Link href="/signin" className={`${ui.primaryButton} w-full`}>
        Sign in
      </Link>
    );
  }
  return (
    <div>
      <p className="text-xs text-muted">Signed in as</p>
      <p className="truncate text-sm font-semibold" title={reader.email ?? undefined}>
        {reader.email}
      </p>
      <SignOutButton className={`${ui.secondaryButton} mt-3 w-full`} />
    </div>
  );
}
