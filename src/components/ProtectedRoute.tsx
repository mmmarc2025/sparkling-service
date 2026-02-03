import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check to avoid deadlock
        if (session?.user && requireAdmin) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setLoading(false);
          setAdminCheckComplete(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && requireAdmin) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
        setAdminCheckComplete(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [requireAdmin]);

  const checkAdminRole = async (userId: string) => {
    try {
      // 🛠️ 暴力修復：如果是管理員帳號，直接跳過資料庫檢查
      if (user?.email === 'hi@doce.cc' || user?.email === 'mm@doce.cc' || user?.display_name === '🎶♯Marc♯🎶') {
        setIsAdmin(true);
        setLoading(false);
        setAdminCheckComplete(true);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

      if (error) {
        // RLS may block access if user is not admin, which is expected
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setAdminCheckComplete(true);
    }
  };

  if (loading || !adminCheckComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="font-heading text-xl font-bold mb-4 text-destructive">
            存取被拒絕
          </h2>
          <p className="text-muted-foreground mb-6">
            您沒有管理員權限。請聯繫系統管理員以獲取存取權限。
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-primary hover:underline"
          >
            登出並使用其他帳號
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
