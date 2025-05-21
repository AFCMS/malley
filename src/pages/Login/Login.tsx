/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../../contexts/auth/AuthContext";

export default function Login() {
  const { isAuthenticated, login, loginWithGoogle, loginWithDiscord } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      await login(email, password);
      void navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      setError("Failed to login with Google");
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await loginWithDiscord();
    } catch {
      setError("Failed to login with Discord");
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
              <label className="fieldset-label">Email</label>
              <input
                name="email"
                type="email"
                className="input validator"
                required
                placeholder="Email"
                autoComplete="email"
              />
              <label className="fieldset-label mt-4">Password</label>
              <input
                name="password"
                type="password"
                className="input validator"
                minLength={6}
                required
                placeholder="Password"
                autoComplete="current-password"
              />
              {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
              <button type="submit" className="btn btn-neutral mt-4">
                Login
              </button>
            </fieldset>
          </form>
          <hr className="border-base-300 my-2" />
          <button className="btn border-[#e5e5e5] bg-white text-black" onClick={handleGoogleLogin}>
            <svg
              aria-label="Google logo"
              width="16"
              height="16"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <g>
                <path d="m0 0H512V512H0" fill="#fff"></path>
                <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
                <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
                <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
              </g>
            </svg>
            Login with Google
          </button>

          <button className="btn mt-2 border-[#e5e5e5] bg-white text-black" onClick={handleDiscordLogin}>
            <svg
              aria-label="Discord logo"
              width="16"
              height="16"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -28.5 256 256"
              version="1.1"
            >
              <g>
                <path
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill="#5865F2"
                  fillRule="nonzero"
                ></path>
              </g>
            </svg>
            Login with Discord
          </button>
        </div>
      </div>
    </div>
  );
}
