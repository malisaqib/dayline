import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/domain/auth/return-path";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { destinationAfterSignIn } from "@/server/services/account";

const LINK_TYPES = new Set<EmailOtpType>(["email", "magiclink", "signup", "email_change"]);

function failed(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/signin?error=link_expired", request.url));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeReturnPath(params.get("next"));
  if (params.get("error") || params.get("error_code")) {
    return failed(request);
  }
  const db = await createReaderSupabase();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  if (tokenHash && type && LINK_TYPES.has(type)) {
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return failed(request);
    }
  } else if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) {
      return failed(request);
    }
  } else {
    return failed(request);
  }
  return NextResponse.redirect(new URL(await destinationAfterSignIn(db, next), request.url));
}
