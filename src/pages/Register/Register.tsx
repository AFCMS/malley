/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/auth/AuthContext";

export default function Register() {
  const { register } = useAuth();
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

  return (
    <div className="container mx-auto mt-24 flex flex-1 grow items-center justify-center">
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <fieldset className="fieldset">
              <label className="fieldset-label">Handle</label>
              <input
                name="handle"
                type="text"
                className="input validator"
                maxLength={15}
                minLength={3}
                required
                placeholder="handle"
              />
              <label className="fieldset-label">Email</label>
              <input name="email" type="email" className="input validator" required placeholder="Email" />
              <label className="fieldset-label">Password</label>
              <input
                name="password"
                type="password"
                className="input validator"
                minLength={6}
                required
                placeholder="Password"
              />
              {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
              <button className="btn btn-neutral mt-4" type="submit">
                Register
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
