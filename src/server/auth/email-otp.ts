import { AuthError, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const emailSchema = z.email().trim().toLowerCase();
export const otpSchema = z.string().trim().regex(/^\d{6,10}$/);

export type OtpMode = "signin" | "upgrade";

export type AuthFailure = { kind: "expired" | "rate_limited" | "email_taken" | "not_allowed" | "delivery" | "unknown"; message: string };

export function describeAuthError(error: unknown): AuthFailure {
  const code = error instanceof AuthError ? (error.code ?? "") : "";
  const status = error instanceof AuthError ? error.status : undefined;
  if (code === "otp_expired" || code === "otp_invalid" || code === "invalid_credentials" || code === "bad_code_verifier" || code === "flow_state_expired") {
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
