import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("callback hit, code:", code, "origin:", origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchange error:", error);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  console.log("no code or error, redirecting to /");
  return NextResponse.redirect(`${origin}/`);
}
