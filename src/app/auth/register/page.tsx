"use client";

import { createClient } from "@/lib/supabase/client";
import { Loader2, Shield, Truck, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type UserRole = "customer" | "provider";

/**
 * Register form component
 * Wrapped in Suspense because useSearchParams()
 * requires a suspense boundary in Next.js 14+
 */
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Initialize role from query param
   * Example:
   * /auth/register?role=provider
   */
  useEffect(() => {
    const queryRole = searchParams.get("role");

    if (queryRole === "provider") {
      setRole("provider");
    } else {
      setRole("customer");
    }
  }, [searchParams]);

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      /**
       * Redirect based on role
       */
      if (role === "provider") {
        router.push("/dashboard/provider/kyc");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create account";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,107,255,0.08)_0%,transparent_60%)]" />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Create your account
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Join SafeDrive Sentinel Global
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["customer", "provider"] as const).map((itemRole) => (
              <button
                key={itemRole}
                type="button"
                onClick={() => setRole(itemRole)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  role === itemRole
                    ? "bg-brand-500/20 border-brand-500/50 text-brand-300"
                    : "bg-transparent border-white/[0.08] text-slate-500 hover:text-slate-300"
                }`}
              >
                {itemRole === "customer" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}

                {itemRole === "customer" ? "Customer" : "Provider"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Full name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                className="input-base w-full"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-brand-400 hover:text-brand-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Required suspense boundary for useSearchParams()
 * in Next.js production builds.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
