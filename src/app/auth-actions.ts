"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/domain/auth/return-path";
import {
  createPasswordAccount,
  describeAuthError,
  emailSchema,
  googleSignInUrl,
  otpSchema,
  passwordSchema,
  signInWithPassword,
  requestGuestUpgrade,
  requestSignInCode,
  verifyEmailCode,
  type OtpMode,
} from "@/server/auth/email-otp";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { destinationAfterSignIn } from "@/server/services/account";

export type SignInState =
  | { step: "email"; error: string | null; email: string }
  | { step: "code"; error: string | null; email: string; mode: OtpMode }
  | { step: "conflict"; error: string | null; email: string };

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

function readMode(form: FormData): OtpMode {
  return form.get("mode") === "upgrade" ? "upgrade" : "signin";
}

export async function requestEmailCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const raw = String(form.get("email") ?? "");
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { step: "email", error: "Enter a valid email address.", email: raw };
  }
  const email = parsed.data;
  const next = safeReturnPath(String(form.get("next") ?? ""));
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const mode: OtpMode = reader?.isAnonymous && form.get("intent") !== "switch" ? "upgrade" : "signin";
  try {
    if (mode === "upgrade") {
      await requestGuestUpgrade(db, email, await confirmUrl(next));
    } else {
      await requestSignInCode(db, email, await confirmUrl(next));
    }
  } catch (error) {
    const failure = describeAuthError(error);
    if (failure.kind === "email_taken" && mode === "upgrade") {
      return { step: "conflict", error: null, email };
    }
    console.error("[auth] request failed", failure.kind);
    return { step: "email", error: failure.message, email };
  }
  return { step: "code", error: null, email, mode };
}

export async function verifySignInCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const mode = readMode(form);
  const email = emailSchema.safeParse(String(form.get("email") ?? ""));
  if (!email.success) {
    return { step: "email", error: "Enter your email address again.", email: "" };
  }
  const token = otpSchema.safeParse(String(form.get("code") ?? ""));
  if (!token.success) {
    return { step: "code", error: "Enter the code from the email, digits only.", email: email.data, mode };
  }
  const db = await createReaderSupabase();
  try {
    await verifyEmailCode(db, email.data, token.data, mode);
  } catch (error) {
    const failure = describeAuthError(error);
    console.error("[auth] verify failed", failure.kind);
    return { step: "code", error: failure.message, email: email.data, mode };
  }
  redirect(await destinationAfterSignIn(db, safeReturnPath(String(form.get("next") ?? ""))));
}

export async function advanceSignIn(prev: SignInState, form: FormData): Promise<SignInState> {
  if (form.get("op") === "verify") {
    return verifySignInCode(prev, form);
  }
  if (form.get("op") === "restart") {
    return { step: "email", error: null, email: String(form.get("email") ?? "") };
  }
  return requestEmailCode(prev, form);
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

export async function startGoogle(form: FormData): Promise<void> {
  const next = safeReturnPath(String(form.get("next") ?? ""));
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  let url: string;
  try {
    url = await googleSignInUrl(db, await confirmUrl(next), reader?.isAnonymous === true);
  } catch (error) {
    console.error("[auth] google failed", describeAuthError(error).kind);
    redirect("/signin?error=google_failed");
  }
  redirect(url);
}

export async function signOut(): Promise<void> {
  const db = await createReaderSupabase();
  await db.auth.signOut();
  redirect("/signin?signed_out=1");
}
