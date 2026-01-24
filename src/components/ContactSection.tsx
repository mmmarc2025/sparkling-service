import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "服務地址",
      content: "台北市信義區松高路100號",
    },
    {
      icon: Phone,
      title: "預約電話",
      content: "02-1234-5678",
    },
    {
      icon: Clock,
      title: "營業時間",
      content: "週一至週日 09:00 - 21:00",
    },
    {
      icon: Mail,
      title: "電子郵件",
      content: "service@washcar.com",
    },
  ];

  return (
    <section id="contact" className="py-20 md:py-32 bg-gradient-dark text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
              聯絡我們
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-6">
              準備好讓愛車
              <br />
              <span className="text-secondary">閃亮登場了嗎？</span>
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8 leading-relaxed">
              立即預約我們的專業洗車服務，讓您的愛車享受最頂級的清潔護理體驗。我們的專業團隊隨時為您服務！
            </p>

            <Button variant="hero" size="xl">
              立即預約洗車
            </Button>
          </motion.div>

          {/* Right Content - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <info.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="text-primary-foreground/70 text-sm">
                  {info.content}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
