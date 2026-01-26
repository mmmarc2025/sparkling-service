
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveAuthToken } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            console.error("Auth error:", error);
            navigate("/login?error=" + error, { replace: true });
            return;
        }

        if (token) {
            saveAuthToken(token);
            // Reload to pick up the new token in AuthContext
            window.location.href = "/admin";
        } else {
            navigate("/login", { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">正在登入中...</p>
            </div>
        </div>
    );
}
