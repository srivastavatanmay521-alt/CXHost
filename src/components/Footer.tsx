import { Twitter, Instagram, Mail } from 'lucide-react';
import DiscordLogo from '../icons/DiscordLogo';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

const Footer = () => {
  const { config } = useSiteConfig();

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com' },
    { icon: Instagram, href: 'https://instagram.com' },
    { icon: Mail, href: `mailto:${config.branding.supportEmail}` },
  ];

  const linkSections = [
    {
      title: 'Products',
      links: [
        { name: 'Bot Hosting', href: '/discord' },
        { name: 'Game Servers', href: '/minecraft' },
        { name: 'VPS Hosting', href: '/vps' },
        { name: 'Pricing', href: '/#pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Features', href: '/#features' },
        { name: 'Support', href: '/support' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Login', href: '/login' },
        { name: 'Admin', href: '/admin' },
        { name: 'Status', href: '/status' },
      ],
    },
  ];

  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 inline-block">
              <img src={config.branding.logo} alt={`${config.branding.name} logo`} className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm max-w-xs">
              {config.branding.tagline}
            </p>
            <div className="flex items-center space-x-4 mt-6">
              <a href="https://discord.gg/your-invite-code" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <DiscordLogo className="w-6 h-6" />
              </a>
              {socialLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <a key={index} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Icon size={22} />
                  </a>
                );
              })}
            </div>
          </div>

          {linkSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {config.branding.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
