// hooks/useSupabase.js
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom hook for facility data
export const useFacilities = (approvedOnly = false) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();

    // Set up real-time subscription with correct syntax
    const channel = supabase
      .channel("facilities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "facilities",
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setFacilities((current) => {
              const existing = current.find((f) => f.id === payload.new.id);
              if (existing) {
                return current.map((f) =>
                  f.id === payload.new.id ? payload.new : f
                );
              } else {
                return [...current, payload.new];
              }
            });
          } else if (payload.eventType === "DELETE") {
            setFacilities((current) =>
              current.filter((f) => f.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [approvedOnly]);

  const fetchFacilities = async () => {
    try {
      let query = supabase.from("facilities").select(`
        *,
        machines (*)
      `);

      if (approvedOnly) {
        query = query.eq("approved", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    } finally {
      setLoading(false);
    }
  };

  return { facilities, loading, refetch: fetchFacilities };
};

// Custom hook for authentication
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signUp, signIn, signOut };
};
