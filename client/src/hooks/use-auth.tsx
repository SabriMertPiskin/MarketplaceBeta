import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authApi, LoginResponse } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "producer" | "admin";
  kvkk_consent: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, kvkkConsent?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe = () => {};
    
    try {
      // Check if there's a saved token from previous session
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken) {
        // In development, just set loading to false without verifying token
        setLoading(false);
        return;
      }
      
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            const idToken = await getIdToken(firebaseUser);
            const response = await authApi.login({ id_token: idToken });
            
            if (response.success) {
              setUser(response.user as User);
              setToken(response.token);
              localStorage.setItem("auth_token", response.token);
              
              // Connect to Socket.IO
              socketService.connect(response.token);
            }
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem("auth_token");
            socketService.disconnect();
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string, kvkkConsent = false) => {
    try {
      setLoading(true);
      
      // For development, try direct API login first
      if (import.meta.env.DEV) {
        try {
          const response = await authApi.login({ 
            email, 
            password, 
            kvkk_consent: kvkkConsent 
          });
          
          if (response.success) {
            setUser(response.user as User);
            setToken(response.token);
            localStorage.setItem("auth_token", response.token);
            socketService.connect(response.token);
            return;
          }
        } catch (devError) {
          // Fall back to Firebase auth
          console.log("Dev login failed, trying Firebase:", devError);
        }
      }

      // Firebase authentication
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await getIdToken(credential.user);
      
      const response = await authApi.login({ 
        id_token: idToken, 
        kvkk_consent: kvkkConsent 
      });
      
      if (response.success) {
        setUser(response.user as User);
        setToken(response.token);
        localStorage.setItem("auth_token", response.token);
        socketService.connect(response.token);
      } else {
        throw new Error("Giriş başarısız");
      }
    } catch (error: any) {
      toast({
        title: "Giriş hatası",
        description: error.message || "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
      socketService.disconnect();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
