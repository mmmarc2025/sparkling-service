import { Car, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-white/5 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold">WashCar</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              結合尖端科技的頂級汽車美容服務。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">快速連結</h4>
            <ul className="space-y-2">
              {[{ label: "服務項目", href: "services" }, { label: "價格方案", href: "pricing" }, { label: "關於我們", href: "about" }, { label: "聯絡我們", href: "contact" }].map((item) => (
                <li key={item.href}>
                  <a
                    href={`#${item.href}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold mb-4">服務項目</h4>
            <ul className="space-y-2">
              {["基本洗車", "精緻美容", "鍍膜服務", "內裝清潔"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">聯絡資訊</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>02-1234-5678</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>service@washcar.com.tw</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>台北市大安區汽車街123號</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} WashCar. 版權所有。
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              隱私權政策
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              服務條款
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
