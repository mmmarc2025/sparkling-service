import { motion } from "framer-motion";
import { Calendar, Car, Sparkles, ThumbsUp } from "lucide-react";

const ProcessSection = () => {
  const steps = [
    {
      icon: Calendar,
      step: "01",
      title: "線上預約",
      description: "選擇服務項目和時間，輕鬆完成預約",
    },
    {
      icon: Car,
      step: "02",
      title: "到店服務",
      description: "按預約時間到店，專業團隊接待您的愛車",
    },
    {
      icon: Sparkles,
      step: "03",
      title: "專業清洗",
      description: "使用頂級設備和環保洗劑進行清潔護理",
    },
    {
      icon: ThumbsUp,
      step: "04",
      title: "品質驗收",
      description: "清洗完成後驗收，確保您滿意後交車",
    },
  ];

  return (
    <section id="process" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            服務流程
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            簡單四步驟<span className="text-gradient">輕鬆洗車</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            從預約到取車，我們讓整個流程簡單又便利
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                {/* Step Circle */}
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4 relative z-10">
                    <step.icon className="w-9 h-9 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
