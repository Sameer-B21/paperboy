import { supabase } from "../../config/supabase.js";
import type { Newsletter } from "../types.js";

type NewsletterRow = {
  id: string;
  user_id: string;
  name: string;
  sender: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

function toNewsletter(row: NewsletterRow): Newsletter {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    sender: row.sender,
    selected: row.selected,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNewsletters(userId: string): Promise<Newsletter[]> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) {
    throw new Error(`Failed to list newsletters: ${error.message}`);
  }
  return (data ?? []).map((row) => toNewsletter(row as NewsletterRow));
}

export async function upsertNewsletter(payload: {
  userId: string;
  name: string;
  sender: string;
  selected: boolean;
}): Promise<Newsletter> {
  const { data, error } = await supabase
    .from("newsletters")
    .upsert(
      {
        user_id: payload.userId,
        name: payload.name,
        sender: payload.sender,
        selected: payload.selected,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,sender" }
    )
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to upsert newsletter: ${error?.message ?? "Unknown error"}`);
  }
  return toNewsletter(data as NewsletterRow);
}

export async function updateNewsletterSelection(
  userId: string,
  newsletterId: string,
  selected: boolean
): Promise<Newsletter> {
  const { data, error } = await supabase
    .from("newsletters")
    .update({ selected, updated_at: new Date().toISOString() })
    .eq("id", newsletterId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update newsletter selection: ${error?.message ?? "Unknown error"}`);
  }
  return toNewsletter(data as NewsletterRow);
}
