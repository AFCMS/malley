import { createContext, useContext } from "react";
import { AuthContextType } from "./AuthProvider";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Authentification impossible");
  }
  return context;
}
