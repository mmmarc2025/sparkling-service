import { motion } from "framer-motion";
import { Car, Sparkles, Shield, Droplets, Wind, Gem } from "lucide-react";

const ServicesSection = () => {
  const services = [
    {
      icon: Car,
      title: "外部清洗",
      description: "高壓水槍清洗車身，去除污垢和灰塵，恢復車漆光澤",
    },
    {
      icon: Sparkles,
      title: "內裝清潔",
      description: "深層清潔座椅、地毯、儀表板，還原車內清新環境",
    },
    {
      icon: Shield,
      title: "打蠟拋光",
      description: "專業打蠟護理，形成保護層，讓車漆持久亮麗",
    },
    {
      icon: Droplets,
      title: "鍍膜服務",
      description: "奈米陶瓷鍍膜技術，提供長效保護與防水效果",
    },
    {
      icon: Wind,
      title: "引擎室清潔",
      description: "專業清潔引擎室，去除油污，延長引擎壽命",
    },
    {
      icon: Gem,
      title: "全車美容",
      description: "從內到外的完整美容服務，讓愛車煥然一新",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="services" className="py-20 md:py-32 bg-background">
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
            我們的服務
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            專業洗車<span className="text-gradient">服務項目</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            從基礎清洗到高端美容，我們提供全方位的汽車護理服務
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-6 lg:p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
