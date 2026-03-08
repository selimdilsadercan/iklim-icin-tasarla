import { createClient } from "@supabase/supabase-js";

// Supabase bağlantı bilgileri (Doğrudan tanımlanmış)
const SUPABASE_URL = "https://drvycatabyudymagulio.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IjpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydnljYXRhYnl1ZHltYWd1bGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MDk0NTMsImV4cCI6MjA2MDA4NTQ1M30.I4cnGn8QekLIBxnTphcho4GGpLD2gRwysySumxgYEOY";

/**
 * Supabase istemcisini başlatır.
 * Service Role Key kullanıyoruz çünkü backend tarafında tüm yetkilere (bypass RLS) ihtiyacımız var.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Auth helper functions (Backend versiyonları)
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Backend tarafında kullanıcıyı JWT üzerinden doğrulamak için kullanılır.
 */
export const getCurrentUser = async (jwt?: string) => {
  if (jwt) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwt);
    return { user, error };
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};
