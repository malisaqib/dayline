import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";

export async function AccountControls() {
  const reader = await getVerifiedReader(await createReaderSupabase());
  if (!reader) {
    return null;
  }
  if (reader.isAnonymous) {
    return (
      <Link href="/signin" className={`${ui.ghostButton} text-accent-strong`}>
        Save to email
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="hidden max-w-48 truncate text-[13px] text-muted md:inline" title={reader.email ?? undefined}>
        {reader.email}
      </span>
      <SignOutButton className={ui.ghostButton} />
    </div>
  );
}
