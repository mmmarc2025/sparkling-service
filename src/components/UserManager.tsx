import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shield, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserData {
    id: string;
    line_user_id: string;
    display_name: string;
    picture_url: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login_at: string;
}

const roleOptions = [
    { value: "super_admin", label: "最高管理員", description: "可存取所有功能", color: "text-red-400" },
    { value: "store_manager", label: "店家管理", description: "管理預約和服務", color: "text-blue-400" },
    { value: "community_manager", label: "社群管理", description: "僅編輯 AI 設定", color: "text-green-400" },
    { value: "user", label: "一般用戶", description: "無後台權限", color: "text-gray-400" },
];

export function UserManager() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({
                title: "載入失敗",
                description: "無法載入用戶資料",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        setSavingUserId(userId);
        try {
            const { error } = await supabase
                .from("users")
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

            toast({
                title: "更新成功",
                description: "用戶權限已更新",
            });
        } catch (error) {
            console.error("Error updating role:", error);
            toast({
                title: "更新失敗",
                description: "無法更新用戶權限",
                variant: "destructive",
            });
        } finally {
            setSavingUserId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">尚無用戶</h3>
                <p className="text-muted-foreground">當用戶透過 LINE 登入後，會自動出現在這裡</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">用戶權限管理</h2>
                <span className="text-sm text-muted-foreground">共 {users.length} 位用戶</span>
            </div>

            {/* Role Legend */}
            <div className="glass-card p-4 mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> 權限層級說明
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {roleOptions.map((role) => (
                        <div key={role.value} className="text-sm">
                            <span className={`font-medium ${role.color}`}>{role.label}</span>
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* User List */}
            {users.map((user, index) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            {user.picture_url ? (
                                <img
                                    src={user.picture_url}
                                    alt={user.display_name || "User"}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold">{user.display_name || "未命名用戶"}</h3>
                                <p className="text-xs text-muted-foreground">
                                    LINE ID: {user.line_user_id.slice(0, 10)}...
                                </p>
                                {user.last_login_at && (
                                    <p className="text-xs text-muted-foreground">
                                        最後登入: {new Date(user.last_login_at).toLocaleString('zh-TW')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value)}
                                disabled={savingUserId === user.id}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            <span className={role.color}>{role.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {savingUserId === user.id && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
