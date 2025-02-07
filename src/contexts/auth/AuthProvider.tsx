import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { getProfile, profileNameAvaillable, supabase } from "../supabase/supabase";
import { AuthContext } from "./AuthContext";

interface Profile {
  created_at: string;
  handle: string | null;
  id: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  register: (handle: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  logoutEverywhereElse: () => Promise<void>;
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(session && user && profile && profile.handle !== null ? true : false);
  }, [profile, session, user]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(session?.user.id ? await getProfile(session.user.id) : null);
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
      setProfile(session?.user.id ? await getProfile(session.user.id) : null);
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
          alert("register 1");

          if (!(await profileNameAvaillable(handle))) {
            throw new Error("Handle already taken");
          }

          alert("register 2");

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

          const up = await supabase.from("profiles").update({ handle: handle }).eq("id", id);
          if (up.error) {
            throw up.error;
          }
        },
        login: async (email: string, password: string) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
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
