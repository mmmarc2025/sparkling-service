
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    line_user_id: string;
    display_name: string;
    picture_url: string;
    role: 'super_admin' | 'store_manager' | 'community_manager' | 'user';
    store_id: number | null;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
    hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kiekwhkebemrfsekfbwf.supabase.co';
const TOKEN_KEY = 'carwash_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            verifyToken(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/line-auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token invalid, clear it
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem(TOKEN_KEY);
        } finally {
            setIsLoading(false);
        }
    };

    const login = () => {
        // Redirect to LINE Login
        window.location.href = `${SUPABASE_URL}/functions/v1/line-auth/login`;
    };

    const logout = async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            try {
                await fetch(`${SUPABASE_URL}/functions/v1/line-auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    };

    const hasRole = (roles: string[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
            hasRole,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to save token from callback
export function saveAuthToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Role constants
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    STORE_MANAGER: 'store_manager',
    COMMUNITY_MANAGER: 'community_manager',
    USER: 'user',
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS = {
    super_admin: ['bookings', 'services', 'stores', 'users', 'ai_settings'],
    store_manager: ['bookings', 'services'],
    community_manager: ['ai_settings'],
    user: [],
};
