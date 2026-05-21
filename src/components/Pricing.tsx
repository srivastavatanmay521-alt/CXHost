import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

const Pricing = () => {
  const { config } = useSiteConfig();

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12"
        >
          <div className="text-center md:text-left">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Simple Pricing <span className="text-blue-400">Plans</span></h2>
            <p className="text-lg text-gray-400 mt-2 max-w-2xl">Start small at ₹{config.payment.minimumOrderAmount} and adjust prices anytime from the admin panel.</p>
          </div>
          <div className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300">
            Payment: {config.payment.providerName}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {config.pricing.plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden group hover:border-blue-500 transition-all duration-300"
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${plan.image})` }}>
                <div className="h-full w-full bg-black/50 flex items-end p-6">
                  <h3 className="text-2xl font-bold text-white">{plan.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-400">{plan.description}</p>
                <p className="text-5xl font-bold text-white my-4">₹{plan.priceINR}<span className="text-lg font-medium text-gray-400">/month</span></p>
                <ul className="space-y-3 my-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.route}>
                  <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                    {plan.buttonText}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
