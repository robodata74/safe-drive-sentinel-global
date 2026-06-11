import { supabase } from "@/lib/supabaseClient";

class TermsEngine {
  async acceptTerms(userId: string, version: string) {
    await supabase.from("user_terms_acceptance").insert({
      id: crypto.randomUUID(),
      userId,
      version,
      acceptedAt: Date.now(),
    });
  }

  async hasAccepted(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_terms_acceptance")
      .select("*")
      .eq("userId", userId)
      .limit(1);

    return !!data?.length;
  }
}

export const termsEngine = new TermsEngine();
