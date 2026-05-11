import { supabase } from "@/lib/supabase";

export async function saveLead(data: {
  email: string;
  company: string;
  role: string;
  teamSize: number;
  savings: number;
}) {
  const { error } = await supabase
    .from("leads")
    .insert([
      {
        email: data.email,
        company: data.company,
        role: data.role,
        team_size: data.teamSize,
        savings: data.savings,
      },
    ]);

  if (error) {
    console.error(error);
    throw error;
  }
}