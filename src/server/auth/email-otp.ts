import { AuthError, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const emailSchema = z.email().trim().toLowerCase();
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72, "Use at most 72 characters.");
export const otpSchema = z.string().trim().regex(/^\d{6,10}$/);

export type OtpMode = "signin" | "upgrade";

export type AuthFailure = { kind: "expired" | "rate_limited" | "email_taken" | "not_allowed" | "delivery" | "unknown"; message: string };

export function describeAuthError(error: unknown): AuthFailure {
  const code = error instanceof AuthError ? (error.code ?? "") : "";
  const status = error instanceof AuthError ? error.status : undefined;
  if (code === "otp_expired" || code === "otp_invalid" || code === "bad_code_verifier" || code === "flow_state_expired") {
    return { kind: "expired", message: "That code or link is wrong or has expired. Request a new one." };
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429) {
    return { kind: "rate_limited", message: "Too many sign-in emails were requested. Please wait a few minutes and try again." };
  }
  if (code === "email_exists" || code === "user_already_exists" || code === "identity_already_exists") {
    return { kind: "email_taken", message: "This email already has a Dayline account." };
  }
  if (code === "email_address_not_authorized") {
    return { kind: "not_allowed", message: "Dayline can't send email to this address yet. Try another address or continue without an account." };
  }
  if (code === "invalid_credentials") {
    return { kind: "expired", message: "That email and password don't match. Try again, or email yourself a code instead." };
  }
  if (code === "email_not_confirmed") {
    return { kind: "not_allowed", message: "Confirm your email first: open the link we sent you, then sign in." };
  }
  if (code === "weak_password") {
    return { kind: "not_allowed", message: "Choose a stronger password: at least 8 characters, not a common one." };
  }
  if (code === "manual_linking_disabled") {
    return { kind: "not_allowed", message: "Linking Google to a guest paper isn't switched on yet. Use your email instead." };
  }
  if (code === "email_address_invalid") {
    return { kind: "not_allowed", message: "That email address isn't valid." };
  }
  if (status !== undefined && status >= 500) {
    return { kind: "delivery", message: "We couldn't send the email just now. Please try again in a moment." };
  }
  return { kind: "unknown", message: "Something went wrong. Please try again." };
}

export async function requestSignInCode(db: SupabaseClient, email: string, redirectTo: string): Promise<void> {
  const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo } });
  if (error) {
    throw error;
  }
}

export async function requestGuestUpgrade(db: SupabaseClient, email: string, redirectTo: string): Promise<void> {
  const { error } = await db.auth.updateUser({ email }, { emailRedirectTo: redirectTo });
  if (error) {
    throw error;
  }
}

export async function verifyEmailCode(db: SupabaseClient, email: string, token: string, mode: OtpMode): Promise<void> {
  const { error } = await db.auth.verifyOtp({ email, token, type: mode === "upgrade" ? "email_change" : "email" });
  if (error) {
    throw error;
  }
}

export async function signInWithPassword(db: SupabaseClient, email: string, password: string): Promise<void> {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

export async function createPasswordAccount(db: SupabaseClient, email: string, password: string, redirectTo: string): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  if (error) {
    throw error;
  }
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new AuthError("This email already has a Dayline account.", 422, "user_already_exists");
  }
  return { needsConfirmation: !data.session };
}

export async function googleSignInUrl(db: SupabaseClient, redirectTo: string, link: boolean): Promise<string> {
  if (link) {
    const { data, error } = await db.auth.linkIdentity({ provider: "google", options: { redirectTo } });
    if (error) {
      throw error;
    }
    return data.url;
  }
  const { data, error } = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) {
    throw error;
  }
  return data.url;
}
