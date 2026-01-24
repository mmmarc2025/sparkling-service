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
  { value: "basic", label: "Basic Wash", price: 30 },
  { value: "premium", label: "Premium Detail", price: 80 },
  { value: "ceramic", label: "Ceramic Coating", price: 300 },
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
        title: "Missing Information",
        description: "Please fill in all fields",
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
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Please try again later",
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
            <h3 className="font-heading text-2xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground">We'll contact you shortly to confirm your appointment.</p>
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
              <h3 className="font-heading text-2xl font-bold mb-1">Book Your Wash</h3>
              <p className="text-muted-foreground text-sm">Schedule in under 60 seconds</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date
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
                  Time
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
                Service Type
              </Label>
              <Select
                value={formData.service}
                onValueChange={(value) => setFormData({ ...formData, service: value })}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-primary">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a service" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {services.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      <span className="flex items-center justify-between w-full gap-4">
                        <span>{service.label}</span>
                        <span className="text-primary font-semibold">${service.price}</span>
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
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-heading font-bold text-primary">
                    ${selectedService.price}
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
                  Processing...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingForm;
