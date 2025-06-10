/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/auth/AuthContext";

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const handle = formData.get("handle") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await register(handle, email, password);
      void navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="container mx-auto mt-24 flex justify-center">
      <div className="card bg-base-100 w-full max-w-sm shrink-0 border border-slate-200 shadow">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <fieldset className="fieldset">
              <label className="fieldset-label">Handle</label>
              <label className="input validator">
                <span className="label">@</span>
                <input
                  name="handle"
                  type="text"
                  className=""
                  maxLength={15}
                  minLength={3}
                  pattern="^[a-zA-Z0-9_]+$"
                  required
                  placeholder="handle"
                />
              </label>
              <label className="fieldset-label">Email</label>
              <input
                name="email"
                type="email"
                className="input validator"
                required
                placeholder="Email"
                autoComplete="email"
              />
              <label className="fieldset-label">Password</label>
              <input
                name="password"
                type="password"
                className="input validator"
                minLength={6}
                required
                placeholder="Password"
                autoComplete="new-password"
              />
              {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
              <button className="btn btn-neutral mt-4" type="submit">
                Register
              </button>
              <hr className="border-base-300 my-2" />
              <Link className="btn btn-neutral lg:hidden" to="/login">
                Login
              </Link>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
