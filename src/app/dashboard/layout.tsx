import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * Auth guard
   */
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-navy-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6">
        <h1 className="text-lg font-semibold mb-6">SafeDrive Sentinel</h1>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block text-slate-300 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/bookings"
            className="block text-slate-300 hover:text-white"
          >
            Bookings
          </Link>

          <Link
            href="/dashboard/providers"
            className="block text-slate-300 hover:text-white"
          >
            Providers
          </Link>

          <Link
            href="/dashboard/fleet"
            className="block text-slate-300 hover:text-white"
          >
            Fleet
          </Link>
        </nav>

        <div className="mt-10 text-sm text-slate-400">
          <div>{profile?.full_name ?? "User"}</div>
          <div className="capitalize">{profile?.role ?? "member"}</div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
