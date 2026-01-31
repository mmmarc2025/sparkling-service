
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Star, Droplets } from "lucide-react";
import BookingForm from "./BookingForm";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0F1C] pt-20 pb-12">
      {/* Animated background bubbles (Foam effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[80px]"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[100px]"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left pt-10 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">極致工藝 ‧ 煥然一新</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-white"
            >
              讓愛車找回
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                剛出廠時的光澤
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              不只是洗車，這是一場關於細節的儀式。
              <br className="hidden md:block" />
              使用頂級藥水與純水工藝，為您的愛車提供最溫柔的深層護理。
            </motion.p>

            {/* Stats / Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8"
            >
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-white">4.9</span>
                </div>
                <div className="text-xs text-gray-500">Google 真實好評</div>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-white">100%</span>
                </div>
                <div className="text-xs text-gray-500">滿意度保證</div>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Droplets className="w-5 h-5 text-cyan-500" />
                  <span className="text-2xl font-bold text-white">3000+</span>
                </div>
                <div className="text-xs text-gray-500">服務車次</div>
              </div>
            </motion.div>
          </div>

          {/* Right content - Booking Form */}
          <div className="flex justify-center lg:justify-end relative">
            {/* Form decorative background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-3xl blur-2xl -z-10 transform rotate-3 scale-105" />
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
