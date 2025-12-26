import { supabase } from "../../config/supabase.js";
import type { User } from "../types.js";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }
  return data ? toUser(data as UserRow) : null;
}

export async function getOrCreateUserByEmail(
  email: string,
  name: string | null
): Promise<User> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }
  if (data) {
    return toUser(data as UserRow);
  }
  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({ email, name })
    .select("*")
    .single();
  if (insertError || !inserted) {
    throw new Error(`Failed to create user: ${insertError?.message ?? "Unknown error"}`);
  }
  return toUser(inserted as UserRow);
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at");
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  return (data ?? []).map((row) => toUser(row as UserRow));
}
