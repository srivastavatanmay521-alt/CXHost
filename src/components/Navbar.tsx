import { useState, useRef, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Bot, Server, Globe, Info, HelpingHand, FileText, Shield, BarChart, LogIn, LayoutDashboard, Megaphone, Music } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

const iconMap: Record<string, ElementType> = {
  Bot,
  Server,
  Globe,
  Info,
  HelpingHand,
  FileText,
  Shield,
  BarChart,
  Megaphone,
  Music,
};

const Navbar = () => {
  const { config } = useSiteConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => setOpenDropdown(null), 100);
  };

  const toggleMobileDropdown = (menu: string) => {
    setMobileDropdown(mobileDropdown === menu ? null : menu);
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-4 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 z-50 flex items-center gap-3">
            {config.branding.logo && (
              <img src={config.branding.logo} alt={`${config.branding.name} logo`} className="h-10 w-auto" />
            )}
            <span className="font-bold text-white text-lg">{config.branding.shortName}</span>
          </Link>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-full px-4 py-2">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full">Home</Link>

              <DropdownGroup title="Services" keyName="services" items={config.navigation.services} openDropdown={openDropdown} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} />
              <DropdownGroup title="More" keyName="more" items={config.navigation.more} openDropdown={openDropdown} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} />
            </div>
          </div>

          <div className="flex items-center z-50 gap-3">
            <Link to="/login" className="hidden md:inline-flex items-center gap-2 border border-gray-700 bg-gray-800/40 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
              <LogIn size={16} /> Login
            </Link>
            <Link to="/admin" className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <LayoutDashboard size={16} /> Admin
            </Link>
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl md:hidden z-40"
            onClick={closeAllMenus}
          >
            <motion.div
              initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute top-24 left-4 right-4 bg-gray-900/80 border border-gray-700 rounded-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-white font-bold text-xl mb-4">Menu</h2>
              <div className="flex flex-col space-y-2">
                <Link to="/" onClick={closeAllMenus} className="text-gray-300 hover:bg-gray-800 p-3 rounded-lg transition-colors">Home</Link>

                <MobileGroup title="Services" items={config.navigation.services} mobileDropdown={mobileDropdown} toggleMobileDropdown={toggleMobileDropdown} closeAllMenus={closeAllMenus} />
                <MobileGroup title="More" items={config.navigation.more} mobileDropdown={mobileDropdown} toggleMobileDropdown={toggleMobileDropdown} closeAllMenus={closeAllMenus} />

                <Link to="/login" onClick={closeAllMenus} className="text-gray-300 hover:bg-gray-800 p-3 rounded-lg transition-colors">Login</Link>
                <Link to="/admin" onClick={closeAllMenus} className="text-gray-300 hover:bg-gray-800 p-3 rounded-lg transition-colors">Admin</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const DropdownGroup = ({
  title,
  keyName,
  items,
  openDropdown,
  handleMouseEnter,
  handleMouseLeave,
}: {
  title: string;
  keyName: string;
  items: { name: string; href: string }[];
  openDropdown: string | null;
  handleMouseEnter: (menu: string) => void;
  handleMouseLeave: () => void;
}) => (
  <div onMouseEnter={() => handleMouseEnter(keyName)} onMouseLeave={handleMouseLeave} className="relative">
    <button className="flex items-center text-gray-300 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-full">
      {title} <ChevronDown size={16} className="ml-1" />
    </button>
    <AnimatePresence>
      {openDropdown === keyName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          className="absolute top-full mt-3 w-80 -translate-x-1/4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 grid grid-cols-2 gap-4"
        >
          {items.map(item => {
            const Icon = iconMap[item.name] ?? Info;
            return (
              <Link key={item.name} to={item.href} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                <Icon size={18} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const MobileGroup = ({
  title,
  items,
  mobileDropdown,
  toggleMobileDropdown,
  closeAllMenus,
}: {
  title: string;
  items: { name: string; href: string }[];
  mobileDropdown: string | null;
  toggleMobileDropdown: (menu: string) => void;
  closeAllMenus: () => void;
}) => (
  <div className="border-t border-b border-gray-700">
    <button onClick={() => toggleMobileDropdown(title.toLowerCase())} className="w-full flex justify-between items-center p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
      <span>{title}</span>
      <ChevronDown size={20} className={`transition-transform ${mobileDropdown === title.toLowerCase() ? 'rotate-180' : ''}`} />
    </button>
    {mobileDropdown === title.toLowerCase() && (
      <div className="pl-4 pb-2 mt-1 space-y-1">
        {items.map(item => {
          const Icon = iconMap[item.name] ?? Info;
          return (
            <Link key={item.name} to={item.href} onClick={closeAllMenus} className="flex items-center gap-3 py-2 text-gray-400 hover:text-white">
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </div>
    )}
  </div>
);

export default Navbar;
