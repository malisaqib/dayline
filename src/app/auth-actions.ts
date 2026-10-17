"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/domain/auth/return-path";
import {
  createPasswordAccount,
  describeAuthError,
  emailSchema,
  passwordSchema,
  signInWithPassword,
  upgradeGuestWithPassword,
} from "@/server/auth/password-auth";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { destinationAfterSignIn } from "@/server/services/account";

async function confirmUrl(next: string | null): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = new URL("/auth/confirm", `${proto}://${host}`);
  if (next) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

export type PasswordState = { error: string | null; notice: string | null; email: string };

export async function passwordAuth(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const raw = String(form.get("email") ?? "");
  const email = emailSchema.safeParse(raw);
  if (!email.success) {
    return { error: "Enter a valid email address.", notice: null, email: raw };
  }
  const password = passwordSchema.safeParse(String(form.get("password") ?? ""));
  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Check your password.", notice: null, email: email.data };
  }
  const next = safeReturnPath(String(form.get("next") ?? ""));
  const db = await createReaderSupabase();
  try {
    const reader = await getVerifiedReader(db);
    if (reader?.isAnonymous && form.get("intent") === "upgrade") {
      const result = await upgradeGuestWithPassword(db, email.data, password.data, await confirmUrl(next));
      if (result.needsConfirmation) {
        return { error: null, notice: `Check ${email.data} for a confirmation link. Your paper stays here meanwhile.`, email: email.data };
      }
      redirect(next ?? "/today");
    }
    if (form.get("intent") === "create") {
      const result = await createPasswordAccount(db, email.data, password.data, await confirmUrl(next));
      if (result.needsConfirmation) {
        return { error: null, notice: `Check ${email.data} for a confirmation link. Open it on this device to finish creating your account.`, email: email.data };
      }
    } else {
      await signInWithPassword(db, email.data, password.data);
    }
  } catch (error) {
    const failure = describeAuthError(error);
    console.error("[auth] password failed", failure.kind);
    if (failure.kind === "email_taken") {
      return {
        error: "This email already has a Dayline account. Dayline won't merge accounts; your guest paper stays in this browser.",
        notice: null,
        email: email.data,
      };
    }
    return { error: failure.message, notice: null, email: email.data };
  }
  redirect(await destinationAfterSignIn(db, next));
}

export async function signOut(): Promise<void> {
  const db = await createReaderSupabase();
  await db.auth.signOut();
  redirect("/signin?signed_out=1");
}
