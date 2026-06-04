import { createClient } from "@/lib/supabase/server";

type Payment = {
  amount: number;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [bookingsResult, paymentsResult, providersResult] = await Promise.all([
    supabase.from("bookings").select("*", {
      count: "exact",
      head: true,
    }),

    supabase.from("payments").select("amount").eq("status", "captured"),

    supabase
      .from("providers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),
  ]);

  const bookingCount = bookingsResult.count ?? 0;

  const activeProviders = providersResult.count ?? 0;

  const payments = paymentsResult.data ?? [];

  const revenueToday = payments.reduce(
    (sum: number, payment: Payment) => sum + Number(payment.amount),
    0,
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <div className="text-slate-400 text-sm">Total Bookings</div>

          <div className="text-3xl font-bold text-white mt-2">
            {bookingCount}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="text-slate-400 text-sm">Revenue</div>

          <div className="text-3xl font-bold text-white mt-2">
            ${revenueToday.toLocaleString()}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="text-slate-400 text-sm">Active Providers</div>

          <div className="text-3xl font-bold text-white mt-2">
            {activeProviders}
          </div>
        </div>
      </div>
    </div>
  );
}
