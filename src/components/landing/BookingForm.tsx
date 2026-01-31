
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Phone, Car, CheckCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kiekwhkebemrfsekfbwf.supabase.co';
const PENDING_BOOKING_KEY = 'pending_booking';

const services = [
  { value: "basic", label: "基本洗車", price: 500, desc: "泡沫清洗 + 內裝簡易吸塵" },
  { value: "premium", label: "精緻美容", price: 1500, desc: "深層去汙 + 手工打蠟 + 皮革保養" },
  { value: "ceramic", label: "頂級鍍膜", price: 6000, desc: "全車拋光 + 雙層鍍膜防護" },
];

const BookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    service: "",
  });

  // Check for pending booking
  useEffect(() => {
    const checkPendingBooking = async () => {
      const pending = localStorage.getItem(PENDING_BOOKING_KEY);
      if (pending) {
        const bookingData = JSON.parse(pending);
        localStorage.removeItem(PENDING_BOOKING_KEY);
        const token = localStorage.getItem('carwash_auth_token');
        if (token) {
          try {
            setIsLoading(true);
            const startTime = new Date(`${bookingData.date}T${bookingData.time}`);
            const { error } = await supabase.from("bookings").insert({
              customer_name: bookingData.name.trim(),
              phone: bookingData.phone.trim(),
              service_type: bookingData.service,
              start_time: startTime.toISOString(),
            });
            if (error) throw error;
            setIsSuccess(true);
            toast({ title: "預約成功！", description: "我們將盡快與您聯繫。" });
          } catch (error) {
            console.error("Pending error:", error);
            toast({ title: "預約失敗", variant: "destructive" });
          } finally {
            setIsLoading(false);
          }
        }
      }
    };
    checkPendingBooking();
  }, [toast]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: "請填寫完整資料", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem('carwash_auth_token');
    if (!token) {
      localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(formData));
      toast({ title: "請先登入", description: "登入後將自動完成預約" });
      window.location.href = `${SUPABASE_URL}/functions/v1/line-auth/login`;
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
    } catch (error) {
      toast({ title: "預約失敗", description: "請稍後再試", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.service) return toast({ title: "請選擇服務" });
    if (step === 2 && (!formData.date || !formData.time)) return toast({ title: "請選擇時間" });
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="glass-card w-full max-w-md overflow-hidden relative min-h-[500px] flex flex-col">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">預約成功！</h3>
              <p className="text-muted-foreground mb-8">我們已收到您的請求，專人將儘快聯繫。</p>
              <Button onClick={() => navigate('/my-bookings')} className="w-full">
                查看我的預約
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold">選擇服務</h3>
                    <p className="text-sm text-muted-foreground">您想要哪種等級的護理？</p>
                  </div>
                  <div className="space-y-3">
                    {services.map((s) => (
                      <div
                        key={s.value}
                        onClick={() => setFormData({ ...formData, service: s.value })}
                        className={cn(
                          "p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/5",
                          formData.service === s.value 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-white/10"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{s.label}</span>
                          <span className="text-primary font-bold">NT${s.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Date & Time */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold">預約時間</h3>
                    <p className="text-sm text-muted-foreground">選擇您方便的時段</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>日期</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="pl-10 h-12"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>時間</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Contact Info */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold">聯絡資料</h3>
                    <p className="text-sm text-muted-foreground">最後一步囉！</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>姓名</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="您的稱呼"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>電話</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="09xx-xxx-xxx"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">服務</span>
                      <span>{services.find(s => s.value === formData.service)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">時間</span>
                      <span>{formData.date} {formData.time}</span>
                    </div>
                    <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold">
                      <span>總計</span>
                      <span className="text-primary">NT${services.find(s => s.value === formData.service)?.price}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {!isSuccess && (
          <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
              </Button>
            )}
            
            {step < 3 ? (
              <Button onClick={nextStep} className="flex-1 ml-auto">
                下一步 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 ml-auto bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "確認預約"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
