import { Droplets } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">WashCar</span>
          </a>

          {/* Links */}
          <ul className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
            <li>
              <a href="#services" className="hover:text-primary-foreground transition-colors">
                服務項目
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-primary-foreground transition-colors">
                價格方案
              </a>
            </li>
            <li>
              <a href="#process" className="hover:text-primary-foreground transition-colors">
                服務流程
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-primary-foreground transition-colors">
                聯絡我們
              </a>
            </li>
          </ul>

          {/* Copyright */}
          <p className="text-sm text-primary-foreground/50">
            © 2024 WashCar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
