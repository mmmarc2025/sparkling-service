import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingSection = () => {
  const plans = [
    {
      name: "基礎清洗",
      price: "299",
      description: "快速外部清潔，適合日常保養",
      features: [
        "高壓水槍清洗",
        "輪胎輪圈清潔",
        "車窗玻璃清潔",
        "免費吸塵服務",
      ],
      popular: false,
    },
    {
      name: "精緻護理",
      price: "599",
      description: "內外兼顧的完整清潔方案",
      features: [
        "包含基礎清洗所有服務",
        "內裝全面清潔",
        "皮革座椅保養",
        "儀表板護理",
        "空調出風口清潔",
      ],
      popular: true,
    },
    {
      name: "尊爵美容",
      price: "1299",
      description: "頂級全方位汽車美容體驗",
      features: [
        "包含精緻護理所有服務",
        "專業打蠟拋光",
        "引擎室清潔",
        "鍍膜防護",
        "車身細節處理",
        "VIP 優先服務",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-muted/30">
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
            價格方案
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            選擇適合您的<span className="text-gradient">服務方案</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            透明定價，無隱藏費用，讓您安心選擇
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-6 lg:p-8 rounded-2xl ${
                plan.popular
                  ? "bg-gradient-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card border border-border hover:border-primary/30 hover:shadow-card"
              } transition-all duration-300`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  最受歡迎
                </div>
              )}

              {/* Plan Details */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p
                  className={`text-sm mb-4 ${
                    plan.popular
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm">NT$</span>
                  <span className="text-5xl font-extrabold">{plan.price}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular
                          ? "bg-primary-foreground/20"
                          : "bg-primary/10"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.popular ? "text-primary-foreground" : "text-primary"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-primary-foreground/90" : ""
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? "heroOutline" : "hero"}
                size="lg"
                className="w-full"
              >
                立即預約
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
