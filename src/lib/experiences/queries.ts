import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getExperienceBySlug as seedBySlug,
  getAllExperiences as seedAll,
} from "./data";
import type { Experience } from "./types";

// Reads from Supabase (the source of truth once seeded). Falls back to the in-code
// seed data so pages keep working before the table is populated or if the DB is down.

export async function fetchExperienceBySlug(slug: string): Promise<Experience | null> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("data, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data?.data) return data.data as Experience;
  } catch {
    // ignore — fall back to seed
  }
  return seedBySlug(slug);
}

export async function fetchPublishedExperiences(): Promise<Experience[]> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("data")
      .eq("status", "published");
    if (!error && data && data.length > 0) {
      return data.map((row) => row.data as Experience);
    }
  } catch {
    // ignore — fall back to seed
  }
  return seedAll();
}
