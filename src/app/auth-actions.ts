"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RESET_PASSWORD_PATH, safeReturnPath } from "@/domain/auth/return-path";
import {
  createPasswordAccount,
  describeAuthError,
  emailSchema,
  passwordSchema,
  sendPasswordReset,
  setNewPassword,
  signInWithPassword,
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
      return { error: "This email already has a Dayline account. Sign in instead.", notice: null, email: email.data };
    }
    return { error: failure.message, notice: null, email: email.data };
  }
  redirect(await destinationAfterSignIn(db, next));
}

export type ResetState = { error: string | null; notice: string | null };

export async function requestPasswordReset(_prev: ResetState, form: FormData): Promise<ResetState> {
  const email = emailSchema.safeParse(String(form.get("email") ?? ""));
  if (!email.success) {
    return { error: "Enter a valid email address.", notice: null };
  }
  try {
    await sendPasswordReset(await createReaderSupabase(), email.data, await confirmUrl(RESET_PASSWORD_PATH));
  } catch (error) {
    const failure = describeAuthError(error);
    console.error("[auth] reset request failed", failure.kind);
    if (failure.kind === "rate_limited" || failure.kind === "delivery" || failure.kind === "not_allowed") {
      return { error: failure.message, notice: null };
    }
  }
  return { error: null, notice: `If ${email.data} has a Dayline account, we've sent a link to reset the password. Open it on this device.` };
}

export async function chooseNewPassword(_prev: ResetState, form: FormData): Promise<ResetState> {
  const password = passwordSchema.safeParse(String(form.get("password") ?? ""));
  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Check your password.", notice: null };
  }
  if (String(form.get("confirm") ?? "") !== password.data) {
    return { error: "The two passwords don't match.", notice: null };
  }
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader || reader.isAnonymous) {
    return { error: "Your reset link has expired. Request a new one from the sign-in page.", notice: null };
  }
  try {
    await setNewPassword(db, password.data);
  } catch (error) {
    return { error: describeAuthError(error).message, notice: null };
  }
  redirect(await destinationAfterSignIn(db, null));
}

export async function signOut(): Promise<void> {
  const db = await createReaderSupabase();
  await db.auth.signOut();
  redirect("/signin?signed_out=1");
}
