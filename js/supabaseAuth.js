import { getSupabaseClient } from "./supabaseStorage.js";

export const initializeSupabaseAuth = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const client = await getSupabaseClient();
  if (!client) {
    return null;
  }

  const {
    data: { session },
  } = await client.auth.getSession();

  window.__BINDAUD_SUPABASE_SESSION = session || null;

  const {
    data: { user },
  } = await client.auth.getUser();

  window.__BINDAUD_SUPABASE_USER = user || null;
  return { client, session, user };
};

export const signOutSupabase = async () => {
  const client = await getSupabaseClient();
  if (!client) {
    return null;
  }

  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }

  window.__BINDAUD_SUPABASE_SESSION = null;
  window.__BINDAUD_SUPABASE_USER = null;
  return true;
};
