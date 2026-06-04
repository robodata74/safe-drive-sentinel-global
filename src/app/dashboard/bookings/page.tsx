import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

const BookingForm = dynamic(() => import("@/components/booking/BookingForm"), {
  ssr: false,
});

type Booking = {
  id: string;
  service_type: string;
  pickup_address: string;
  dropoff_address: string;
  fare_amount: number | null;
  status: string;
};

const statusColors: Record<string, string> = {
  searching: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  matched: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  in_progress: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  completed: "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default async function BookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * Redirect unauthenticated users
   */
  if (!user) {
    redirect("/auth/login");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Bookings</h1>

          <p className="text-sm text-slate-500 mt-0.5">
            Manage your rescue requests
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Booking list */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-white">Your bookings</h2>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {!bookings?.length ? (
              <div className="px-5 py-12 text-center">
                <div className="text-3xl mb-3">🚛</div>

                <p className="text-sm text-slate-400">
                  No bookings yet. Create your first rescue request.
                </p>
              </div>
            ) : (
              bookings.map((booking: Booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate capitalize">
                      {booking.service_type.replace(/_/g, " ")}
                    </div>

                    <div className="text-xs text-slate-500 truncate">
                      {booking.pickup_address}
                      {" → "}
                      {booking.dropoff_address}
                    </div>
                  </div>

                  <div className="text-sm text-slate-300">
                    {booking.fare_amount
                      ? formatCurrency(booking.fare_amount)
                      : "—"}
                  </div>

                  <span
                    className={`status-badge ${
                      statusColors[booking.status] ??
                      "text-slate-400 bg-slate-400/10 border-slate-400/20"
                    }`}
                  >
                    {booking.status.replace(/_/g, " ")}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Booking form */}
        <div>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" />
            New rescue request
          </h2>

          <BookingForm />
        </div>
      </div>
    </div>
  );
}
