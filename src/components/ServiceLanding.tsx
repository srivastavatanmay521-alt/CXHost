import { motion } from 'framer-motion';
import { ArrowRight, Bot, Server, Globe, Music, Star, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

const iconMap = {
  discord: Bot,
  minecraft: Server,
  vps: Globe,
  lavalink: Music,
};

type ServiceKey = keyof typeof iconMap;

type Props = {
  planId?: string;
  title: string;
  description: string;
  icon: ServiceKey;
};

const ServiceLanding = ({ title, description, icon }: Props) => {
  const { config } = useSiteConfig();
  const Icon = iconMap[icon];
  const plans = config.pricing.plans.filter(p => p.service === icon);

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <Icon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold">{title}</h1>
          <p className="text-gray-300 mt-3 max-w-3xl mx-auto text-lg">{description}</p>
        </motion.div>

        {plans.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-14 text-center max-w-lg mx-auto">
            <PackageOpen className="w-14 h-14 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Plans Coming Soon</h2>
            <p className="text-gray-400">We're working on plans for this service. Check back soon or reach out to our support team.</p>
            <Link to="/support" className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl px-5 py-3 font-semibold text-sm">
              Contact Support <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-md mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border p-6 flex flex-col ${plan.popular ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-700'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-1">{plan.title}</h2>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="text-4xl font-bold mb-6">
                  ₹{plan.priceINR}<span className="text-base font-medium text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 text-gray-300 text-sm flex-1 mb-6">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <Link to={plan.route}>
                  <button className={`w-full inline-flex items-center justify-center gap-2 transition-colors rounded-xl px-5 py-3 font-semibold text-sm ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {plan.buttonText} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-12 bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4">Why choose {config.branding.shortName}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
            <div className="rounded-xl border border-gray-700 bg-black/20 p-4">Instant provisioning after payment webhook confirmation.</div>
            <div className="rounded-xl border border-gray-700 bg-black/20 p-4">Prices and plans managed live from the admin panel.</div>
            <div className="rounded-xl border border-gray-700 bg-black/20 p-4">Discord login and manual login both supported.</div>
            <div className="rounded-xl border border-gray-700 bg-black/20 p-4">DDoS protection and enterprise-grade hardware.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceLanding;
