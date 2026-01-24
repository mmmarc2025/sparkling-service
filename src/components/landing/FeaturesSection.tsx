import { motion } from "framer-motion";
import { Shield, Clock, Star, Droplets, Leaf, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "頂級防護",
    description: "採用先進的陶瓷鍍膜和漆面保護技術，為您的愛車抵禦各種環境侵害。",
  },
  {
    icon: Clock,
    title: "快速服務",
    description: "大部分服務在數小時內完成，讓您快速取車，不耽誤行程。",
  },
  {
    icon: Star,
    title: "五星品質",
    description: "客戶一致給予五星好評，值得信賴的優質服務。",
  },
  {
    icon: Droplets,
    title: "環保節水",
    description: "採用節水技術和環保清潔用品，對地球更友善。",
  },
  {
    icon: Leaf,
    title: "天然產品",
    description: "提供無化學成分的內裝清潔和美容選項。",
  },
  {
    icon: Award,
    title: "專業認證",
    description: "團隊擁有最新美容技術認證，專業可靠。",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            為什麼選擇 <span className="text-gradient">我們的服務</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            結合尖端科技與專業工藝，為您提供卓越的服務體驗。
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass-card p-6 md:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center mb-5 group-hover:shadow-glow transition-shadow duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
