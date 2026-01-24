import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Car,
  Save,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  service_type: string;
  start_time: string;
  status: string;
  created_at: string;
}

const serviceLabels: Record<string, { label: string; price: number }> = {
  basic: { label: "Basic Wash", price: 30 },
  premium: { label: "Premium Detail", price: 80 },
  ceramic: { label: "Ceramic Coating", price: 300 },
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const Admin = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Fetch system prompt
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "GEMINI_SYSTEM_PROMPT")
          .single();

        if (error && error.code !== "PGRST116") throw error;
        setSystemPrompt(data?.value || "");
      } catch (error) {
        console.error("Error fetching system prompt:", error);
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    fetchSystemPrompt();
  }, []);

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdatingBookingId(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );

      toast({
        title: "Status Updated",
        description: `Booking marked as ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const saveSystemPrompt = async () => {
    setIsSavingPrompt(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ 
          key: "GEMINI_SYSTEM_PROMPT", 
          value: systemPrompt,
          description: "System instruction for the LINE Bot AI assistant"
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "System prompt updated successfully",
      });
    } catch (error) {
      console.error("Error saving system prompt:", error);
      toast({
        title: "Error",
        description: "Failed to save system prompt",
        variant: "destructive",
      });
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-heading text-xl md:text-2xl font-bold">
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-8">
          <TabsList className="glass p-1 h-auto">
            <TabsTrigger
              value="bookings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 touch-target"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 touch-target"
            >
              <Settings className="w-4 h-4 mr-2" />
              AI Configuration
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {isLoadingBookings ? (
                <div className="glass-card p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    No Bookings Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Bookings will appear here when customers make reservations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block glass-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 font-heading font-semibold text-sm">
                            Customer
                          </th>
                          <th className="text-left p-4 font-heading font-semibold text-sm">
                            Phone
                          </th>
                          <th className="text-left p-4 font-heading font-semibold text-sm">
                            Service
                          </th>
                          <th className="text-left p-4 font-heading font-semibold text-sm">
                            Time
                          </th>
                          <th className="text-left p-4 font-heading font-semibold text-sm">
                            Status
                          </th>
                          <th className="text-right p-4 font-heading font-semibold text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-white/5 last:border-0"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-medium">
                                  {booking.customer_name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {booking.phone}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-primary" />
                                <span>
                                  {serviceLabels[booking.service_type]?.label ||
                                    booking.service_type}
                                </span>
                                <span className="text-primary font-semibold">
                                  ${serviceLabels[booking.service_type]?.price || 0}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {format(new Date(booking.start_time), "MMM d, yyyy h:mm a")}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                  statusColors[booking.status] || statusColors.PENDING
                                }`}
                              >
                                {booking.status === "PENDING" && (
                                  <Clock className="w-3 h-3" />
                                )}
                                {booking.status === "COMPLETED" && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                {booking.status === "CANCELLED" && (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {booking.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                {booking.status === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                      onClick={() =>
                                        updateBookingStatus(booking.id, "COMPLETED")
                                      }
                                      disabled={updatingBookingId === booking.id}
                                    >
                                      {updatingBookingId === booking.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                      onClick={() =>
                                        updateBookingStatus(booking.id, "CANCELLED")
                                      }
                                      disabled={updatingBookingId === booking.id}
                                    >
                                      {updatingBookingId === booking.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{booking.customer_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {booking.phone}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              statusColors[booking.status] || statusColors.PENDING
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Service</p>
                            <p className="font-medium">
                              {serviceLabels[booking.service_type]?.label ||
                                booking.service_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Price</p>
                            <p className="font-medium text-primary">
                              ${serviceLabels[booking.service_type]?.price || 0}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground mb-1">Time</p>
                            <p className="font-medium">
                              {format(new Date(booking.start_time), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>

                        {booking.status === "PENDING" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                              onClick={() =>
                                updateBookingStatus(booking.id, "COMPLETED")
                              }
                              disabled={updatingBookingId === booking.id}
                            >
                              {updatingBookingId === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Complete
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                              onClick={() =>
                                updateBookingStatus(booking.id, "CANCELLED")
                              }
                              disabled={updatingBookingId === booking.id}
                            >
                              {updatingBookingId === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* AI Configuration Tab */}
          <TabsContent value="ai">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">AI Configuration</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure the LINE Bot AI assistant behavior
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-prompt" className="text-sm font-medium">
                    System Instruction
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This instruction tells the AI how to behave when responding to customers.
                  </p>
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful car wash assistant..."
                    className="min-h-[200px] bg-white/5 border-white/10 focus:border-primary resize-none"
                    disabled={isLoadingPrompt}
                  />
                </div>

                <Button
                  onClick={saveSystemPrompt}
                  disabled={isSavingPrompt || isLoadingPrompt}
                  className="w-full sm:w-auto"
                >
                  {isSavingPrompt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
