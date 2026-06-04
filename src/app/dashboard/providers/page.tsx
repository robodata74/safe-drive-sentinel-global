import { createClient } from "@/lib/supabase/server";

type Provider = {
  id: string;
  company_name: string;
  status: string;
};

export default async function ProvidersPage() {
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("providers")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-white mb-6">Providers</h1>

      {!providers?.length ? (
        <div className="glass-card p-6 text-slate-400">No providers found.</div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider: Provider) => (
            <div
              key={provider.id}
              className="glass-card p-4 flex justify-between"
            >
              <div>
                <div className="font-medium text-white">
                  {provider.company_name}
                </div>

                <div className="text-sm text-slate-400 capitalize">
                  {provider.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
