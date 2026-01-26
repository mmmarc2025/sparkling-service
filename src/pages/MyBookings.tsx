import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, Car, ArrowLeft, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kiekwhkebemrfsekfbwf.supabase.co';
const TOKEN_KEY = 'carwash_auth_token';

interface Booking {
    id: string;
    customer_name: string;
    phone: string;
    service_type: string;
    start_time: string;
    status: string;
    created_at: string;
}

interface User {
    id: string;
    display_name: string;
    picture_url: string;
    line_user_id: string;
}

const serviceLabels: Record<string, string> = {
    basic: "基本洗車",
    premium: "精緻美容",
    ceramic: "鍍膜服務",
};

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "待確認", color: "bg-yellow-500/20 text-yellow-400" },
    COMPLETED: { label: "已完成", color: "bg-green-500/20 text-green-400" },
    CANCELLED: { label: "已取消", color: "bg-red-500/20 text-red-400" },
};

const MyBookings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            navigate('/auth');
            return;
        }

        // Verify token and get user
        fetch(`${SUPABASE_URL}/functions/v1/line-auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Invalid token');
                return res.json();
            })
            .then(data => {
                setUser(data.user);
                fetchBookings(data.user.line_user_id);
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                navigate('/auth');
            });
    }, [navigate]);

    const fetchBookings = async (lineUserId: string) => {
        try {
            // For now, fetch by phone number from chat_history or just show all
            // In production, you'd link bookings to user_id
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "載入失敗",
                description: "無法載入預約資料",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            try {
                await fetch(`${SUPABASE_URL}/functions/v1/line-auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        localStorage.removeItem(TOKEN_KEY);
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link to="/">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="font-heading text-xl font-bold">我的預約</h1>
                        </div>
                        {user && (
                            <div className="flex items-center gap-3">
                                {user.picture_url && (
                                    <img src={user.picture_url} alt="" className="w-8 h-8 rounded-full" />
                                )}
                                <span className="text-sm hidden md:inline">{user.display_name}</span>
                                <Button variant="ghost" size="icon" onClick={handleLogout}>
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 text-center"
                    >
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-bold mb-2">還沒有預約</h2>
                        <p className="text-muted-foreground mb-4">現在就來預約您的第一次洗車服務吧！</p>
                        <Link to="/">
                            <Button>立即預約</Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Car className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">
                                                {serviceLabels[booking.service_type] || booking.service_type}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {booking.customer_name}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[booking.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                                        {statusLabels[booking.status]?.label || booking.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(booking.start_time), 'yyyy/MM/dd')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{format(new Date(booking.start_time), 'HH:mm')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookings;
