import { createContext, useState } from "react";
import type { ReactNode } from "react";

interface Client {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  client: Client | null;
  token: string | null;
  login: (clientData: Client, jwtToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (clientData: Client, jwtToken: string) => {
    setClient(clientData);
    setToken(jwtToken);
  };

  const logout = () => {
    setClient(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ client, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;