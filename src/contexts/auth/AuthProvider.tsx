import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";

import { queries, supabase } from "../supabase/supabase";
import { Tables } from "../supabase/database";

import { AuthContext } from "./AuthContext";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Tables<"profiles"> | null;
  isAuthenticated: boolean;
  register: (handle: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  logoutEverywhereElse: () => Promise<void>;
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(session && user && profile ? true : false);
  }, [profile, session, user]);

  async function handleUserUpdate(session: Session | null) {
    setProfile(session?.user.id ? await queries.profiles.get(session.user.id) : null);
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      void handleUserUpdate(session);
    });

    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setProfile(session?.user.id ? await queries.profiles.get(session.user.id) : null);
    };

    void setData();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAuthenticated,
        register: async (handle: string, email: string, password: string) => {
          if (!(await queries.profiles.isNameAvailable(handle))) {
            throw new Error("Handle already taken");
          }

          const { error, data } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: { handle: handle },
            },
          });

          if (error) {
            throw error;
          }

          const id = data.user?.id;

          if (!id) {
            throw new Error("No user id");
          }
        },
        login: async (email: string, password: string) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw error;
          }
        },
        loginWithGoogle: async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/login`,
            },
          });
          if (error) {
            throw error;
          }
        },
        loginWithDiscord: async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
              redirectTo: `${window.location.origin}/login`,
            },
          });
          if (error) {
            throw error;
          }
        },
        logout: async () => {
          await supabase.auth.signOut({ scope: "local" });
        },
        logoutEverywhere: async () => {
          await supabase.auth.signOut({ scope: "global" });
        },
        logoutEverywhereElse: async () => {
          await supabase.auth.signOut({ scope: "others" });
        },
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
