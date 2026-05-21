import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Wrench, Sparkles, AlertTriangle, ChevronDown, Calendar, Tag, Pin,
} from 'lucide-react';
import { loadAnnouncements, type AdminAnnouncement } from '../lib/dashboardStore';

type AnnouncementCategory = 'all' | 'update' | 'maintenance' | 'feature' | 'incident';

const HARDCODED: AdminAnnouncement[] = [
  {
    id: 'h1', title: 'Welcome to CX Hosting 2.0 🎉',
    summary: 'We have completely rebuilt our infrastructure for better performance and reliability.',
    body: 'We are excited to announce the complete rebuild of our hosting infrastructure. New nodes have been deployed across multiple regions with NVMe SSD storage, boosting I/O speeds by up to 3x. All existing customers have been migrated automatically with zero downtime. Enjoy faster provisioning, better DDoS protection, and a redesigned admin panel.',
    category: 'update', date: 'May 20, 2026', pinned: true, badge: 'Major Update', published: true,
  },
  {
    id: 'h2', title: 'New Feature: One-Click Discord Bot Deploy',
    summary: 'Deploy your Discord bot directly from GitHub with a single click.',
    body: 'You can now connect your GitHub repository to your bot server and deploy with a single click from the control panel. Supports Node.js, Python, and Go runtimes. Auto-restarts on crash and sends you a Discord DM notification when your bot goes offline.',
    category: 'feature', date: 'May 15, 2026', pinned: false, badge: 'New', published: true,
  },
  {
    id: 'h3', title: 'Scheduled Maintenance — May 18, 2026',
    summary: 'Brief maintenance window on the Minecraft cluster from 3:00 AM to 4:00 AM IST.',
    body: 'We will be performing kernel upgrades on all Minecraft hosting nodes during low-traffic hours. Expected downtime per server is under 2 minutes. All servers will resume automatically after the maintenance window. No action is required from your side.',
    category: 'maintenance', date: 'May 14, 2026', pinned: false, badge: '', published: true,
  },
  {
    id: 'h4', title: 'VPS Plans — 20% Price Drop',
    summary: 'All VPS plans have received a permanent 20% price reduction starting June 1.',
    body: 'Thanks to our improved infrastructure and economies of scale, we are permanently reducing VPS plan prices by 20%. Existing subscribers will see their next invoice automatically adjusted.',
    category: 'update', date: 'May 10, 2026', pinned: false, badge: '', published: true,
  },
  {
    id: 'h5', title: 'Incident: Payment Gateway Disruption (Resolved)',
    summary: 'A brief disruption to our UPI payment processor was resolved within 30 minutes.',
    body: 'On May 8, 2026, between 6:14 PM and 6:47 PM IST, some customers experienced failed payment confirmations. All affected orders have been manually verified and provisioned.',
    category: 'incident', date: 'May 8, 2026', pinned: false, badge: '', published: true,
  },
  {
    id: 'h6', title: 'Introducing IPv6 Support Across All Plans',
    summary: 'All hosting plans now include a free IPv6 address by default.',
    body: "IPv6 is now available on all Discord Bot, Minecraft, and VPS plans at no additional cost. Your existing server will receive an IPv6 address automatically within 24 hours.",
    category: 'feature', date: 'May 3, 2026', pinned: false, badge: '', published: true,
  },
];

const categoryConfig = {
  update: { label: 'Update', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  feature: { label: 'Feature', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  incident: { label: 'Incident', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-400' },
};

const filterTabs: { key: AnnouncementCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'update', label: 'Updates' },
  { key: 'feature', label: 'Features' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'incident', label: 'Incidents' },
];

const AnnouncementCard = ({ item, index }: { item: AdminAnnouncement; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = categoryConfig[item.category];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`relative rounded-2xl border ${cfg.border} bg-gray-900/60 backdrop-blur-sm overflow-hidden`}
    >
      {item.pinned && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
          <Pin size={10} /> Pinned
        </div>
      )}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.dot}`} />
      <div className="p-6 pl-7">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Icon size={12} /> {cfg.label}
          </span>
          {item.badge && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white">
              <Tag size={10} /> {item.badge}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} /> {item.date}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mb-1.5 leading-snug">{item.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{item.summary}</p>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <p className="mt-4 text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-4 whitespace-pre-wrap">{item.body}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setExpanded(!expanded)}
          className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${cfg.color} hover:underline transition-colors`}>
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown size={15} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
};

const AnnouncementsPage = () => {
  const [activeFilter, setActiveFilter] = useState<AnnouncementCategory>('all');
  const stored = loadAnnouncements().filter(a => a.published);
  const all: AdminAnnouncement[] = stored.length > 0 ? stored : HARDCODED;

  const pinned = all.filter(a => a.pinned);
  const filtered = activeFilter === 'all'
    ? all.filter(a => !a.pinned)
    : all.filter(a => a.category === activeFilter && !a.pinned);

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-5">
            <Megaphone className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Announcements</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Stay up-to-date with the latest news, feature releases, maintenance windows, and service updates from CX Hosting.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 justify-center mb-10">
          {filterTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeFilter === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </motion.div>

        {activeFilter === 'all' && pinned.length > 0 && (
          <div className="mb-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Pin size={12} /> Pinned
            </p>
            <AnimatePresence mode="popLayout">
              {pinned.map((item, i) => <AnnouncementCard key={item.id} item={item} index={i} />)}
            </AnimatePresence>
          </div>
        )}

        <div className="space-y-4">
          {activeFilter === 'all' && filtered.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Recent</p>
          )}
          <AnimatePresence mode="popLayout">
            {filtered.length > 0
              ? filtered.map((item, i) => <AnnouncementCard key={item.id} item={item} index={i} />)
              : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
                  <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No announcements in this category yet.</p>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
