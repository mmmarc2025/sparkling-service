
import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Service {
    id: number;
    name: string;
    category: "TIERED" | "FLAT";
    description: string | null;
    price_small: string | null;
    price_medium: string | null;
    price_large: string | null;
    price_flat: string | null;
    is_active: boolean;
}

export function ServiceManager() {
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "TIERED" as "TIERED" | "FLAT",
        description: "",
        price_small: "",
        price_medium: "",
        price_large: "",
        price_flat: "",
    });

    const fetchServices = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("services")
                .select("*")
                .order("id", { ascending: true });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error("Error fetching services:", error);
            toast({
                title: "錯誤",
                description: "無法載入服務項目",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                category: service.category as "TIERED" | "FLAT",
                description: service.description || "",
                price_small: service.price_small || "",
                price_medium: service.price_medium || "",
                price_large: service.price_large || "",
                price_flat: service.price_flat || "",
            });
        } else {
            setEditingService(null);
            setFormData({
                name: "",
                category: "TIERED",
                description: "",
                price_small: "",
                price_medium: "",
                price_large: "",
                price_flat: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.name) {
                toast({ title: "錯誤", description: "請輸入服務名稱", variant: "destructive" });
                return;
            }

            const payload = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                price_small: formData.category === 'TIERED' ? formData.price_small : null,
                price_medium: formData.category === 'TIERED' ? formData.price_medium : null,
                price_large: formData.category === 'TIERED' ? formData.price_large : null,
                price_flat: formData.category === 'FLAT' ? formData.price_flat : null,
            };

            if (editingService) {
                const { error } = await (supabase as any)
                    .from("services")
                    .update(payload)
                    .eq("id", editingService.id);
                if (error) throw error;
                toast({ title: "成功", description: "服務項目已更新" });
            } else {
                const { error } = await (supabase as any)
                    .from("services")
                    .insert([payload]);
                if (error) throw error;
                toast({ title: "成功", description: "已新增服務項目" });
            }

            setIsDialogOpen(false);
            fetchServices();
        } catch (error) {
            console.error("Error saving service:", error);
            toast({ title: "錯誤", description: "儲存失敗", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("確定要刪除此服務項目嗎？")) return;
        try {
            const { error } = await (supabase as any)
                .from("services")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast({ title: "已刪除", description: "服務項目已移除" });
            fetchServices();
        } catch (error) {
            console.error("Error deleting service:", error);
            toast({ title: "錯誤", description: "刪除失敗", variant: "destructive" });
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    服務項目管理
                </h2>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增服務
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="rounded-md border border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white/5 hover:bg-white/5 border-white/10">
                                <TableHead>服務名稱</TableHead>
                                <TableHead>類別</TableHead>
                                <TableHead>價格詳情</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium">
                                        <div>{service.name}</div>
                                        {service.description && (
                                            <div className="text-xs text-muted-foreground mt-1">{service.description}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {service.category === 'TIERED' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                分車型
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                不分車型
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {service.category === 'TIERED' ? (
                                            <div className="text-sm space-y-1">
                                                <div className="flex gap-2"><span className="text-muted-foreground w-12">Small:</span> {service.price_small}</div>
                                                <div className="flex gap-2"><span className="text-muted-foreground w-12">Medium:</span> {service.price_medium}</div>
                                                <div className="flex gap-2"><span className="text-muted-foreground w-12">Large:</span> {service.price_large}</div>
                                            </div>
                                        ) : (
                                            <div className="text-sm font-semibold text-primary">
                                                ${service.price_flat}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                                                <Pencil className="w-4 h-4 text-blue-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(service.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-card border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{editingService ? "編輯服務" : "新增服務"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">服務名稱</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>收費模式</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val: "TIERED" | "FLAT") => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TIERED">分車型 (小/中/大)</SelectItem>
                                    <SelectItem value="FLAT">單一價格 (不分車型)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.category === 'TIERED' ? (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-2">
                                    <Label className="text-xs">小型車價格</Label>
                                    <Input
                                        value={formData.price_small}
                                        onChange={(e) => setFormData({ ...formData, price_small: e.target.value })}
                                        placeholder="800"
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">中型車價格</Label>
                                    <Input
                                        value={formData.price_medium}
                                        onChange={(e) => setFormData({ ...formData, price_medium: e.target.value })}
                                        placeholder="1000"
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">大型車價格</Label>
                                    <Input
                                        value={formData.price_large}
                                        onChange={(e) => setFormData({ ...formData, price_large: e.target.value })}
                                        placeholder="1200"
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>價格</Label>
                                <Input
                                    value={formData.price_flat}
                                    onChange={(e) => setFormData({ ...formData, price_flat: e.target.value })}
                                    placeholder="2000"
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>服務說明 (AI 將參考此說明)</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-white/5 border-white/10"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave}>儲存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
