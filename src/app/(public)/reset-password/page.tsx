import Link from "next/link";
import { NewPasswordForm } from "@/features/auth/ResetForms";
import { Reveal } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import { PageMain } from "@/features/shell/PageMain";
import { getVerifiedReader, type Reader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";

export const dynamic = "force-dynamic";

function renderExpired() {
  return (
    <>
      <p className={ui.eyebrow}>Reset password</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">This reset link has expired</h1>
      <p className="mt-3 text-muted">Reset links work once, on the device that opens them. Request a new one and open it here.</p>
      <Link href="/signin?mode=reset" className={`${ui.primaryButton} mt-6`}>
        Request a new link
      </Link>
    </>
  );
}

function renderForm(email: string | null) {
  return (
    <>
      <p className={ui.eyebrow}>Reset password</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Set a new password</h1>
      <p className="mt-3 text-muted">For {email}. Your topics, interests and past papers stay as they are.</p>
      <NewPasswordForm />
    </>
  );
}

function renderContent(reader: Reader | null) {
  if (!reader || reader.isAnonymous) {
    return renderExpired();
  }
  return renderForm(reader.email);
}

export default async function ResetPasswordPage() {
  const reader = await getVerifiedReader(await createReaderSupabase());
  return (
    <PageMain>
      <Reveal className={`${ui.card} mx-auto max-w-md p-6 sm:p-8`}>{renderContent(reader)}</Reveal>
    </PageMain>
  );
}
