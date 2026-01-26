import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Phone, Car, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const services = [
  { value: "basic", label: "基本洗車", price: 500 },
  { value: "premium", label: "精緻美容", price: 1500 },
  { value: "ceramic", label: "鍍膜服務", price: 6000 },
];

const BookingForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    service: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.service) {
      toast({
        title: "資料不完整",
        description: "請填寫所有欄位",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);
      
      const { error } = await supabase.from("bookings").insert({
        customer_name: formData.name.trim(),
        phone: formData.phone.trim(),
        service_type: formData.service,
        start_time: startTime.toISOString(),
      });

      if (error) throw error;

      setIsSuccess(true);
      setFormData({ name: "", phone: "", date: "", time: "", service: "" });
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Booking error:", error);
      }
      toast({
        title: "預約失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find(s => s.value === formData.service);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6 md:p-8 w-full max-w-md"
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="font-heading text-2xl font-bold mb-2">預約成功！</h3>
            <p className="text-muted-foreground">我們將盡快與您聯繫確認預約詳情。</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="text-center mb-6">
              <h3 className="font-heading text-2xl font-bold mb-1">線上預約</h3>
              <p className="text-muted-foreground text-sm">60 秒快速預約</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                姓名
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="王小明"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                電話號碼
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912-345-678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  日期
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">
                  時間
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service" className="text-sm font-medium">
                服務項目
              </Label>
              <Select
                value={formData.service}
                onValueChange={(value) => setFormData({ ...formData, service: value })}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-primary">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="請選擇服務" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {services.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      <span className="flex items-center justify-between w-full gap-4">
                        <span>{service.label}</span>
                        <span className="text-primary font-semibold">NT${service.price}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">總計</span>
                  <span className="text-2xl font-heading font-bold text-primary">
                    NT${selectedService.price}
                  </span>
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  處理中...
                </>
              ) : (
                "確認預約"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingForm;
