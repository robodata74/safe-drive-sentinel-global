import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type Flatbed = {
  id: string;
  registration_number: string;
  status: string;
};

export default async function FleetPage() {
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

  /**
   * Get provider
   */
  const { data: provider } = await supabase
    .from("providers")
    .select("id, company_name")
    .eq("owner_id", user.id)
    .single();

  /**
   * No provider profile yet
   */
  if (!provider) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white">Fleet</h1>

        <p className="text-slate-400 mt-2">No provider profile found.</p>
      </div>
    );
  }

  /**
   * Get flatbeds
   */
  const { data: flatbeds } = await supabase
    .from("flatbeds")
    .select("*")
    .eq("provider_id", provider.id);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-white mb-1">Fleet</h1>

      <p className="text-slate-400 mb-6">{provider.company_name}</p>

      {!flatbeds?.length ? (
        <div className="glass-card p-6 text-slate-400">
          No flatbeds added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {flatbeds.map((flatbed: Flatbed) => (
            <div
              key={flatbed.id}
              className="glass-card p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-white">
                  {flatbed.registration_number}
                </div>

                <div className="text-sm text-slate-400 capitalize">
                  {flatbed.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
