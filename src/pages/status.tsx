import { motion } from 'framer-motion';
import { BarChartHorizontal, CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { type ServiceStatus } from '../config.js';

const getStatusProps = (status: ServiceStatus) => {
  switch (status) {
    case 'Operational':
      return { color: 'text-green-400', Icon: CheckCircle2, label: 'Operational' };
    case 'Degraded Performance':
      return { color: 'text-yellow-400', Icon: AlertTriangle, label: 'Degraded Performance' };
    case 'Partial Outage':
      return { color: 'text-orange-400', Icon: AlertTriangle, label: 'Partial Outage' };
    case 'Major Outage':
      return { color: 'text-red-500', Icon: XCircle, label: 'Major Outage' };
    case 'Under Maintenance':
      return { color: 'text-blue-400', Icon: Wrench, label: 'Under Maintenance' };
    default:
      return { color: 'text-gray-400', Icon: CheckCircle2, label: 'Unknown' };
  }
};

const StatusPage = () => {
  const { config } = useSiteConfig();
  const overallStatus = config.status.services.some(service => service.status !== 'Operational')
    ? 'Some systems are experiencing issues'
    : config.status.overall;

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
          <BarChartHorizontal className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold">Service Status</h1>
          <p className="text-gray-300 mt-2">Live updates controlled from the admin panel.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className={`max-w-4xl mx-auto p-4 rounded-lg mb-12 border ${overallStatus === 'All Systems Operational' ? 'bg-green-500/10 border-green-400' : 'bg-yellow-500/10 border-yellow-400'}`}
        >
          <p className={`font-bold text-center ${overallStatus === 'All Systems Operational' ? 'text-green-300' : 'text-yellow-300'}`}>{overallStatus}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 divide-y divide-gray-700"
        >
          {config.status.services.map((service, index) => {
            const { color, Icon, label } = getStatusProps(service.status);
            return (
              <div key={`${service.name}-${index}`} className="p-4 flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">{service.name}</h2>
                  <p className="text-sm text-gray-400">{service.description}</p>
                </div>
                <div className={`flex items-center gap-2 font-semibold ${color} mt-2 md:mt-0`}>
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </div>
              </div>
            );
          })}
        </motion.div>

        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-10">Incident History</h2>
          <div className="space-y-8">
            {config.status.incidents.map((incident, index) => (
              <motion.div
                key={`${incident.title}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-blue-300">{incident.title}</h3>
                    <p className="text-sm text-gray-400">{incident.date}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gray-700 text-xs font-semibold uppercase tracking-wider">
                    {incident.status}
                  </span>
                </div>

                <div className="space-y-3 border-l-2 border-gray-600 pl-4 ml-2">
                  {incident.updates.map((update, updateIndex) => (
                    <div key={`${update.time}-${updateIndex}`}>
                      <p className="text-xs text-gray-500 mb-1">{update.time}</p>
                      <p className="text-gray-300">{update.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
