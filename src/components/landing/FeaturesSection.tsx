import { motion } from "framer-motion";
import { Shield, Clock, Star, Droplets, Leaf, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Premium Protection",
    description: "Advanced ceramic coatings and paint protection to shield your vehicle from the elements.",
  },
  {
    icon: Clock,
    title: "Quick Turnaround",
    description: "Most services completed within hours, not days. Get back on the road faster.",
  },
  {
    icon: Star,
    title: "5-Star Quality",
    description: "Consistently rated 5 stars by our customers. Quality you can trust every time.",
  },
  {
    icon: Droplets,
    title: "Eco-Friendly",
    description: "Water-saving techniques and biodegradable products that are gentle on the planet.",
  },
  {
    icon: Leaf,
    title: "Natural Products",
    description: "Chemical-free options available for interior cleaning and detailing.",
  },
  {
    icon: Award,
    title: "Certified Experts",
    description: "Our team is certified in the latest detailing techniques and technologies.",
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
            Why Choose <span className="text-gradient">Our Service</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We combine cutting-edge technology with expert craftsmanship to deliver exceptional results.
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
