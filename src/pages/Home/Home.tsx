import { useEffect, useState } from "react";
import { supabase } from "../../contexts/supabase/supabase";
import { PostgrestSingleResponse, UserResponse } from "@supabase/supabase-js";
import { useAuth } from "../../contexts/auth/AuthContext";

export default function Home() {
  const auth = useAuth();

  const [data, setData] = useState<PostgrestSingleResponse<
    {
      created_at: string;
      handle: string | null;
      id: string;
    }[]
  > | null>(null);

  const [data2, setData2] = useState<UserResponse | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then((res) => {
        setData(res);
      });
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then((res) => {
      setData2(res);
    });
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-full max-w-3xl bg-amber-300 md:max-w-7xl lg:px-8">
        <div className="lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="flex flex-col"></div>
          <h1>Home</h1>
          <span>{JSON.stringify(data2?.data.user)}</span>
          <br />
          {auth.isAuthenticated ? <div>{auth.profile?.handle}</div> : <div>Not authenticated</div>}
          {data?.data?.map((user) => {
            return <div key={user.id}>{user.id + "::" + user.created_at}</div>;
          })}
        </div>
        <span>content</span>
      </div>
    </div>
  );
}
