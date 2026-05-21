import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, RefreshCw, Save, Settings2, ShieldCheck, BarChart3,
  Plus, Trash2, Tag, Bot, Server, Globe, Music, ToggleLeft, ToggleRight,
  CheckCircle2, AlertTriangle, XCircle, Wrench, Pencil, X, Star,
  MessageSquare, Clock, Send, Lock, KeyRound, Eye, EyeOff, ShieldAlert,
  Activity, ChevronDown, Megaphone,
} from 'lucide-react';
import { defaultSiteConfig, type SiteConfig, type ServiceStatus, type PricingPlan, type PlanService } from '../config.js';
import { useSiteConfig } from '../context/SiteConfigContext';
import {
  loadOrders, loadUsers, loadServers, loadDiscounts, saveDiscounts, uid,
  loadTickets, saveTickets, loadAdminLog, logAdminActivity,
  loadAnnouncements, saveAnnouncements,
  type DiscountCode, type Ticket, type TicketStatus, type AdminAnnouncement,
} from '../lib/dashboardStore';

const LOCK_KEY = 'cx-admin-lock-minutes';

const statusOptions: ServiceStatus[] = [
  'Operational', 'Degraded Performance', 'Partial Outage', 'Major Outage', 'Under Maintenance',
];

const SERVICE_META: Record<PlanService, { label: string; icon: React.ElementType; color: string; image: string }> = {
  discord: { label: 'Discord Bots', icon: Bot, color: 'text-indigo-400', image: '/discord.jpeg' },
  minecraft: { label: 'Minecraft', icon: Server, color: 'text-green-400', image: '/minecraft.jpeg' },
  lavalink: { label: 'Lavalink', icon: Music, color: 'text-purple-400', image: '/discord.jpeg' },
  vps: { label: 'VPS', icon: Globe, color: 'text-blue-400', image: '/vps.jpeg' },
};

const SERVICES: PlanService[] = ['discord', 'minecraft', 'lavalink', 'vps'];

const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400 border-gray-600' },
};

const emptyPlanDraft = (service: PlanService): Omit<PricingPlan, 'id'> => ({
  service,
  title: '',
  description: '',
  image: SERVICE_META[service].image,
  priceINR: 49,
  route: `/order/${service}-custom-${uid()}`,
  buttonText: 'Order Now',
  popular: false,
  features: [''],
});

const emptyCodeDraft = (): Omit<DiscountCode, 'id' | 'usedCount' | 'createdAt'> => ({
  code: '',
  type: 'percentage',
  value: 10,
  planIds: null,
  expiresAt: null,
  maxUses: null,
  isActive: true,
  description: '',
});

const getPasswordStrength = (pwd: string) => {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const text = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'];
  const i = Math.min(Math.max(s - 1, 0), 4);
  return { score: s, label: pwd ? labels[i] : '', barColor: colors[i], textColor: text[i] };
};

type Tab = 'overview' | 'plans' | 'discounts' | 'tickets' | 'announcements' | 'status' | 'settings' | 'security';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'plans', label: 'Plan Manager' },
  { key: 'discounts', label: 'Discount Codes' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'status', label: 'Status' },
  { key: 'settings', label: 'Settings' },
  { key: 'security', label: '🔒 Security' },
];

const AdminPage = () => {
  const { config, setConfig, resetConfig } = useSiteConfig();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [discounts, setDiscountsState] = useState<DiscountCode[]>(() => loadDiscounts());
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>(() => loadAnnouncements());
  const [codeDraft, setCodeDraft] = useState<Omit<DiscountCode, 'id' | 'usedCount' | 'createdAt'>>(emptyCodeDraft);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [planDrafts, setPlanDrafts] = useState<Partial<Record<PlanService, Omit<PricingPlan, 'id'> & { featuresText: string }>>>({});
  const [showPlanForm, setShowPlanForm] = useState<PlanService | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [lockMinutes, setLockMinutes] = useState(() => Number(localStorage.getItem(LOCK_KEY) ?? '30'));
  const lastActivityRef = useRef(Date.now());
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthed || lockMinutes === 0) return;
    const reset = () => { lastActivityRef.current = Date.now(); };
    document.addEventListener('mousemove', reset);
    document.addEventListener('keydown', reset);
    document.addEventListener('click', reset);
    const iv = setInterval(() => {
      if (Date.now() - lastActivityRef.current > lockMinutes * 60 * 1000) {
        setIsAuthed(false);
        logAdminActivity('Auto-locked due to inactivity');
      }
    }, 15_000);
    return () => {
      document.removeEventListener('mousemove', reset);
      document.removeEventListener('keydown', reset);
      document.removeEventListener('click', reset);
      clearInterval(iv);
    };
  }, [isAuthed, lockMinutes]);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  const save = (updater: (c: SiteConfig) => SiteConfig) => {
    setConfig(updater);
    notify('Saved.');
  };

  const persistDiscounts = (codes: DiscountCode[]) => {
    saveDiscounts(codes);
    setDiscountsState(codes);
  };

  const persistTickets = (tks: Ticket[]) => {
    saveTickets(tks);
    setTickets(tks);
  };

  const persistAnnouncements = (items: AdminAnnouncement[]) => {
    saveAnnouncements(items);
    setAnnouncements(items);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      setMessage(`Too many attempts. Wait ${secs}s.`);
      return;
    }
    if (password === config.admin.password) {
      setIsAuthed(true);
      setLoginAttempts(0);
      logAdminActivity('Admin logged in');
    } else {
      const next = loginAttempts + 1;
      setLoginAttempts(next);
      if (next >= 5) {
        const until = Date.now() + 30_000;
        setLockedUntil(until);
        setLoginAttempts(0);
        logAdminActivity('Admin login locked — too many failed attempts');
        setMessage('5 failed attempts. Locked for 30 seconds.');
      } else {
        setMessage(`Wrong password. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} remaining.`);
      }
    }
  };

  if (!isAuthed) {
    const remaining = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;
    return (
      <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
        <div className="container mx-auto px-4 py-20 pt-32 max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <div className="text-center mb-6">
              <ShieldCheck className="w-14 h-14 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">{config.admin.title}</h1>
              <p className="text-gray-400 mt-1 text-sm">Enter your admin password to continue.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'}
                  placeholder="Admin password" disabled={remaining > 0}
                  className="w-full rounded-xl bg-black/40 border border-gray-700 px-4 py-3 pr-12 outline-none focus:border-blue-500 disabled:opacity-50" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginAttempts > 0 && !lockedUntil && (
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < loginAttempts ? 'bg-red-500' : 'bg-gray-700'}`} />
                  ))}
                </div>
              )}
              <button type="submit" disabled={remaining > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2">
                {remaining > 0 ? <><Lock className="w-4 h-4" /> Locked ({remaining}s)</> : <><KeyRound className="w-4 h-4" /> Unlock Panel</>}
              </button>
            </form>
            {message && <p className="mt-3 text-red-400 text-sm text-center">{message}</p>}
          </motion.div>
        </div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-28 max-w-7xl">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="uppercase tracking-widest text-blue-400 text-xs font-semibold mb-1">Admin</p>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-blue-400" /> {config.branding.name} Control
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setIsAuthed(false); logAdminActivity('Admin manually locked panel'); }}
              className="rounded-xl border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800/50 flex items-center gap-1.5 text-yellow-400 border-yellow-500/30">
              <Lock className="w-4 h-4" /> Lock
            </button>
            <button onClick={() => { resetConfig(); notify('Reset to defaults.'); }}
              className="rounded-xl border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800/50 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button onClick={() => { setConfig(defaultSiteConfig); notify('Defaults loaded.'); }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700 flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Load Defaults
            </button>
          </div>
        </motion.div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-blue-100 text-sm">
            {message}
          </motion.div>
        )}

        <div className="flex gap-2 flex-wrap mb-8 border-b border-gray-700 pb-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}>
              {t.label}
              {t.key === 'tickets' && openTickets > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {openTickets > 9 ? '9+' : openTickets}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab config={config} discounts={discounts} tickets={tickets} />}
        {activeTab === 'plans' && (
          <PlansTab config={config} save={save} planDrafts={planDrafts} setPlanDrafts={setPlanDrafts}
            showPlanForm={showPlanForm} setShowPlanForm={setShowPlanForm}
            editingPlanId={editingPlanId} setEditingPlanId={setEditingPlanId} notify={notify} />
        )}
        {activeTab === 'discounts' && (
          <DiscountsTab config={config} discounts={discounts} persistDiscounts={persistDiscounts}
            codeDraft={codeDraft} setCodeDraft={setCodeDraft}
            showCodeForm={showCodeForm} setShowCodeForm={setShowCodeForm} notify={notify} />
        )}
        {activeTab === 'tickets' && (
          <TicketsTab tickets={tickets} persistTickets={persistTickets} />
        )}
        {activeTab === 'announcements' && (
          <AnnouncementsAdminTab announcements={announcements} persistAnnouncements={persistAnnouncements} notify={notify} />
        )}
        {activeTab === 'status' && <StatusTab config={config} save={save} />}
        {activeTab === 'settings' && <SettingsTab config={config} save={save} />}
        {activeTab === 'security' && (
          <SecurityTab config={config} save={save} notify={notify}
            lockMinutes={lockMinutes}
            setLockMinutes={(m) => { setLockMinutes(m); localStorage.setItem(LOCK_KEY, String(m)); }}
            onLock={() => { setIsAuthed(false); logAdminActivity('Admin manually locked panel'); }} />
        )}
      </div>
    </div>
  );
};

const OverviewTab = ({ config, discounts, tickets }: { config: SiteConfig; discounts: DiscountCode[]; tickets: Ticket[] }) => {
  const orders = loadOrders();
  const users = loadUsers();
  const servers = loadServers();
  const activeCodes = discounts.filter(d => d.isActive).length;
  const openTickets = tickets.filter(t => t.status === 'open');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Orders" value={String(orders.length)} sub="total placed" />
        <StatCard label="Users" value={String(users.length)} sub="registered" />
        <StatCard label="Servers" value={String(servers.length)} sub="provisioned" />
        <StatCard label="Open Tickets" value={String(openTickets.length)} sub="awaiting reply" color={openTickets.length > 0 ? 'text-yellow-400' : 'text-green-400'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map(svc => {
          const meta = SERVICE_META[svc];
          const Icon = meta.icon;
          const count = config.pricing.plans.filter(p => p.service === svc).length;
          return (
            <div key={svc} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${meta.color}`} />
              <div>
                <div className="font-semibold">{meta.label}</div>
                <div className="text-sm text-gray-400">{count} plan{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
          <h3 className="font-bold text-lg mb-3">Recent Orders</h3>
          {orders.length === 0 ? <p className="text-gray-500 text-sm">No orders yet.</p> : (
            <div className="space-y-2">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex justify-between items-center rounded-lg bg-black/20 border border-gray-700 px-4 py-2 text-sm">
                  <div>
                    <span className="font-medium">{o.planTitle}</span>
                    <span className="text-gray-400 ml-2">· {o.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'paid' ? 'bg-green-500/20 text-green-400' : o.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
          <h3 className="font-bold text-lg mb-3">Open Tickets</h3>
          {openTickets.length === 0 ? <p className="text-gray-500 text-sm">No open tickets. 🎉</p> : (
            <div className="space-y-2">
              {openTickets.slice(0, 5).map(t => (
                <div key={t.id} className="rounded-lg bg-black/20 border border-yellow-500/20 px-4 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{t.subject}</span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{t.priority}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{t.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketsTab = ({ tickets, persistTickets }: { tickets: Ticket[]; persistTickets: (t: Ticket[]) => void }) => {
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const sorted = [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const updateStatus = (id: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    persistTickets(tickets.map(t => t.id === id ? { ...t, status, updatedAt: now } : t));
    logAdminActivity(`Ticket ${id} status → ${status}`);
  };

  const sendReply = (id: string) => {
    if (!replyText.trim()) return;
    const now = new Date().toISOString();
    persistTickets(tickets.map(t => t.id === id ? {
      ...t, updatedAt: now,
      messages: [...t.messages, { id: uid(), from: 'admin' as const, text: replyText.trim(), createdAt: now }],
    } : t));
    logAdminActivity(`Replied to ticket ${id}`);
    setReplyText('');
  };

  const openTicket = tickets.find(t => t.id === openId);
  const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'open', 'in-progress', 'resolved', 'closed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}>
            {s === 'all' ? `All (${tickets.length})` : `${s} (${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/40 rounded-2xl border border-gray-700">
          <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(ticket => {
            const sm = TICKET_STATUS_META[ticket.status];
            const isOpen = openId === ticket.id;
            const hasAdminReply = ticket.messages.some(m => m.from === 'admin');
            return (
              <div key={ticket.id} className={`rounded-2xl border bg-gray-800/50 transition-all ${isOpen ? 'border-blue-500/40' : 'border-gray-700'}`}>
                <button onClick={() => setOpenId(isOpen ? null : ticket.id)} className="w-full text-left p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sm.color}`}>{sm.label}</span>
                      <span className={`text-xs font-semibold uppercase ${ticket.priority === 'high' ? 'text-red-400' : ticket.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500 capitalize bg-gray-700/50 px-2 py-0.5 rounded-full">{ticket.category}</span>
                      {!hasAdminReply && ticket.status === 'open' && (
                        <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">Needs Reply</span>
                      )}
                    </div>
                    <p className="font-bold">{ticket.subject}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{ticket.email} · {fmt(ticket.createdAt)}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-gray-700 pt-4 space-y-4">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Change Status:</span>
                          {(['open', 'in-progress', 'resolved', 'closed'] as TicketStatus[]).map(s => (
                            <button key={s} onClick={() => updateStatus(ticket.id, s)}
                              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors capitalize ${ticket.status === s ? TICKET_STATUS_META[s].color : 'border-gray-700 text-gray-500 hover:text-white'}`}>
                              {s}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {ticket.messages.map(msg => (
                            <div key={msg.id} className={`rounded-xl p-3 text-sm ${msg.from === 'user' ? 'bg-blue-500/10 border border-blue-500/20 mr-8' : 'bg-gray-700/60 border border-gray-600 ml-8'}`}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                  {msg.from === 'admin' ? '⚡ Admin' : '👤 User'}
                                </span>
                                <span className="text-xs text-gray-500">{fmt(msg.createdAt)}</span>
                              </div>
                              <p className="text-gray-200 whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder="Reply as admin…" rows={2}
                            className="flex-1 rounded-xl bg-black/40 border border-gray-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none" />
                          <button onClick={() => sendReply(ticket.id)}
                            className="self-end bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors">
                            <Send className="w-4 h-4" /> Send
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EMPTY_ANNOUNCEMENT = (): Omit<AdminAnnouncement, 'id'> => ({
  title: '', summary: '', body: '', category: 'update', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  pinned: false, badge: '', published: false,
});

const CAT_COLORS: Record<string, string> = {
  update: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  feature: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  maintenance: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  incident: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const AnnouncementsAdminTab = ({
  announcements, persistAnnouncements, notify,
}: {
  announcements: AdminAnnouncement[];
  persistAnnouncements: (items: AdminAnnouncement[]) => void;
  notify: (m: string) => void;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Omit<AdminAnnouncement, 'id'>>(EMPTY_ANNOUNCEMENT());
  const [editId, setEditId] = useState<string | null>(null);

  const updateDraft = (field: string, value: unknown) => setDraft(prev => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setDraft(EMPTY_ANNOUNCEMENT());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (item: AdminAnnouncement) => {
    setDraft({ title: item.title, summary: item.summary, body: item.body, category: item.category, date: item.date, pinned: item.pinned, badge: item.badge, published: item.published });
    setEditId(item.id);
    setShowForm(true);
  };

  const save = () => {
    if (!draft.title.trim() || !draft.summary.trim()) { notify('Title and summary are required.'); return; }
    if (editId) {
      persistAnnouncements(announcements.map(a => a.id === editId ? { ...draft, id: editId } : a));
      notify('Announcement updated.');
    } else {
      persistAnnouncements([{ ...draft, id: uid() }, ...announcements]);
      notify('Announcement created.');
    }
    setShowForm(false);
    setEditId(null);
  };

  const deleteItem = (id: string) => {
    persistAnnouncements(announcements.filter(a => a.id !== id));
    notify('Deleted.');
  };

  const toggle = (id: string, field: 'pinned' | 'published') => {
    persistAnnouncements(announcements.map(a => a.id === id ? { ...a, [field]: !a[field] } : a));
  };

  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-400" /> Announcements
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Create and publish announcements that appear on the public Announcements page.
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-gray-800/60 rounded-2xl border border-blue-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">
                {editId ? 'Edit Announcement' : 'New Announcement'}
              </p>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Title *" value={draft.title} onChange={v => updateDraft('title', v)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Category</label>
                <select value={draft.category} onChange={e => updateDraft('category', e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500">
                  <option value="update">Update</option>
                  <option value="feature">Feature</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="incident">Incident</option>
                </select>
              </div>
              <Field label="Date (e.g. May 21, 2026)" value={draft.date} onChange={v => updateDraft('date', v)} />
              <Field label="Badge label (optional, e.g. New / Major Update)" value={draft.badge} onChange={v => updateDraft('badge', v)} />
              <div className="flex gap-4 items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={draft.pinned} onChange={e => updateDraft('pinned', e.target.checked)} className="h-4 w-4 accent-amber-400" />
                  📌 Pin to top
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={draft.published} onChange={e => updateDraft('published', e.target.checked)} className="h-4 w-4 accent-green-500" />
                  ✅ Publish now
                </label>
              </div>
            </div>

            <Textarea label="Summary (shown in card preview) *" value={draft.summary} onChange={v => updateDraft('summary', v)} rows={2} />
            <Textarea label="Full body (shown when expanded)" value={draft.body} onChange={v => updateDraft('body', v)} rows={5} />

            <div className="flex gap-2">
              <button onClick={save} className="bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create Announcement'}
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/40 rounded-2xl border border-gray-700">
          <Megaphone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No announcements yet. Click "New Announcement" to create one.</p>
          <p className="text-gray-500 text-sm mt-1">Until you create one, the public page shows the built-in default announcements.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(item => (
            <div key={item.id} className={`rounded-2xl border p-4 bg-gray-800/50 flex flex-col md:flex-row md:items-start gap-4 ${item.pinned ? 'border-amber-500/30' : 'border-gray-700'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 items-center mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${CAT_COLORS[item.category]}`}>{item.category}</span>
                  {item.badge && <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">{item.badge}</span>}
                  {item.pinned && <span className="text-xs text-amber-400 font-semibold">📌 Pinned</span>}
                  {item.published
                    ? <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">✓ Published</span>
                    : <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">Draft</span>}
                  <span className="text-xs text-gray-500 ml-auto">{item.date}</span>
                </div>
                <p className="font-bold text-white">{item.title}</p>
                <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{item.summary}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button onClick={() => toggle(item.id, 'published')} title={item.published ? 'Unpublish' : 'Publish'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${item.published ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-gray-700 text-gray-500 hover:text-green-400 hover:border-green-500/30'}`}>
                  {item.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => toggle(item.id, 'pinned')} title={item.pinned ? 'Unpin' : 'Pin'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                  {item.pinned ? '📌 Unpin' : '📌 Pin'}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SecurityTab = ({
  config, save, notify, lockMinutes, setLockMinutes, onLock,
}: {
  config: SiteConfig;
  save: (u: (c: SiteConfig) => SiteConfig) => void;
  notify: (m: string) => void;
  lockMinutes: number;
  setLockMinutes: (m: number) => void;
  onLock: () => void;
}) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const log = loadAdminLog();
  const strength = getPasswordStrength(newPw);

  const changePassword = () => {
    setPwError('');
    setPwSuccess('');
    if (currentPw !== config.admin.password) { setPwError('Current password is incorrect.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    save(c => ({ ...c, admin: { ...c.admin, password: newPw } }));
    logAdminActivity('Admin password changed');
    setPwSuccess('Password changed successfully!');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSuccess(''), 4000);
  };

  const clearLog = () => {
    localStorage.removeItem('cx-hosting-admin-log');
    notify('Activity log cleared.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><KeyRound className="w-5 h-5 text-blue-400" /> Change Password</h2>
        <div className="space-y-4 max-w-md">
          <div className="relative">
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-blue-500" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-blue-500" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPw && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < strength.score ? strength.barColor : 'bg-gray-700'}`} />
                  ))}
                </div>
                <p className={`text-xs ${strength.textColor}`}>{strength.label}</p>
                <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {newPw.length < 10 && <li>• Use at least 10 characters</li>}
                  {!/[A-Z]/.test(newPw) && <li>• Add an uppercase letter</li>}
                  {!/[0-9]/.test(newPw) && <li>• Add a number</li>}
                  {!/[^A-Za-z0-9]/.test(newPw) && <li>• Add a special character (e.g. #, @, !)</li>}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className={`w-full rounded-xl bg-black/40 border px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors ${confirmPw && confirmPw !== newPw ? 'border-red-500' : 'border-gray-700'}`} />
            {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-400 mt-1">Passwords don't match.</p>}
          </div>

          {pwError && <p className="text-sm text-red-400">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{pwSuccess}</p>}

          <button onClick={changePassword} className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Change Password
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-400" /> Session Auto-Lock</h2>
        <p className="text-sm text-gray-400 mb-4">Panel will auto-lock after this period of inactivity.</p>
        <div className="flex flex-wrap gap-2">
          {[{ v: 0, label: 'Never' }, { v: 15, label: '15 min' }, { v: 30, label: '30 min' }, { v: 60, label: '1 hour' }, { v: 120, label: '2 hours' }].map(opt => (
            <button key={opt.v} onClick={() => setLockMinutes(opt.v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${lockMinutes === opt.v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/20 border-gray-700 text-gray-400 hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button onClick={onLock} className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 font-semibold bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 px-4 py-2 rounded-xl transition-colors">
            <Lock className="w-4 h-4" /> Lock Panel Now
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Activity Log</h2>
          <button onClick={clearLog} className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
        {log.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {log.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 text-sm rounded-lg bg-black/20 border border-gray-700 px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-200">{entry.action}</span>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-400"><ShieldAlert className="w-5 h-5" /> Security Tips</h2>
        <ul className="text-sm text-gray-400 space-y-1.5">
          <li>• Use a password with 12+ characters, mixed case, numbers, and symbols.</li>
          <li>• Never share your admin password. Change it if you suspect a breach.</li>
          <li>• Enable auto-lock to protect against unauthorized access when away.</li>
          <li>• After 5 failed login attempts, the panel locks for 30 seconds.</li>
          <li>• Default password is stored client-side — do not use in production without a backend.</li>
        </ul>
      </div>
    </div>
  );
};

const PlansTab = ({
  config, save, planDrafts, setPlanDrafts, showPlanForm, setShowPlanForm, editingPlanId, setEditingPlanId, notify,
}: {
  config: SiteConfig;
  save: (u: (c: SiteConfig) => SiteConfig) => void;
  planDrafts: Partial<Record<PlanService, Omit<PricingPlan, 'id'> & { featuresText: string }>>;
  setPlanDrafts: React.Dispatch<React.SetStateAction<typeof planDrafts>>;
  showPlanForm: PlanService | null;
  setShowPlanForm: (s: PlanService | null) => void;
  editingPlanId: string | null;
  setEditingPlanId: (id: string | null) => void;
  notify: (m: string) => void;
}) => {
  const openAddForm = (svc: PlanService) => {
    const draft = emptyPlanDraft(svc);
    setPlanDrafts(prev => ({ ...prev, [svc]: { ...draft, featuresText: draft.features.join('\n') } }));
    setShowPlanForm(svc);
  };

  const addPlan = (svc: PlanService) => {
    const draft = planDrafts[svc];
    if (!draft || !draft.title.trim()) { notify('Title is required.'); return; }
    const newPlan: PricingPlan = {
      id: `${svc}-${uid()}`,
      service: svc,
      title: draft.title,
      description: draft.description,
      image: draft.image,
      priceINR: Number(draft.priceINR),
      route: `/order/${svc}-${uid()}`,
      buttonText: draft.buttonText || 'Order Now',
      popular: draft.popular,
      features: draft.featuresText.split('\n').map(f => f.trim()).filter(Boolean),
    };
    save(c => ({ ...c, pricing: { plans: [...c.pricing.plans, newPlan] } }));
    setShowPlanForm(null);
    notify(`${newPlan.title} added.`);
  };

  const deletePlan = (id: string) => {
    save(c => ({ ...c, pricing: { plans: c.pricing.plans.filter(p => p.id !== id) } }));
    notify('Plan deleted.');
  };

  const updatePlan = (id: string, field: keyof PricingPlan, value: unknown) => {
    save(c => ({
      ...c,
      pricing: { plans: c.pricing.plans.map(p => p.id === id ? { ...p, [field]: value } : p) },
    }));
  };

  return (
    <div className="space-y-8">
      {SERVICES.map(svc => {
        const meta = SERVICE_META[svc];
        const Icon = meta.icon;
        const plans = config.pricing.plans.filter(p => p.service === svc);
        const draft = planDrafts[svc];
        const isOpen = showPlanForm === svc;

        return (
          <section key={svc} className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Icon className={`w-5 h-5 ${meta.color}`} /> {meta.label}
                <span className="text-sm font-normal text-gray-400 ml-1">({plans.length} plan{plans.length !== 1 ? 's' : ''})</span>
              </h2>
              <button onClick={() => isOpen ? setShowPlanForm(null) : openAddForm(svc)}
                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isOpen ? 'Cancel' : 'Add Plan'}
              </button>
            </div>

            {isOpen && draft && (
              <div className="mb-5 bg-black/30 rounded-xl border border-blue-500/30 p-4 space-y-3">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2">New Plan</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Title *" value={draft.title} onChange={v => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, title: v } }))} />
                  <Field label="Price (₹)" value={String(draft.priceINR)} type="number" onChange={v => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, priceINR: Number(v) } }))} />
                  <Field label="Button text" value={draft.buttonText} onChange={v => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, buttonText: v } }))} />
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={draft.popular} onChange={e => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, popular: e.target.checked } }))} className="h-4 w-4" />
                      Mark as popular
                    </label>
                  </div>
                </div>
                <Textarea label="Description" value={draft.description} onChange={v => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, description: v } }))} rows={2} />
                <Textarea label="Features (one per line)" value={draft.featuresText} onChange={v => setPlanDrafts(prev => ({ ...prev, [svc]: { ...prev[svc]!, featuresText: v } }))} rows={4} />
                <button onClick={() => addPlan(svc)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Plan
                </button>
              </div>
            )}

            {plans.length === 0 ? (
              <p className="text-gray-500 text-sm">No plans yet. Click "Add Plan" to create one.</p>
            ) : (
              <div className="space-y-3">
                {plans.map(plan => (
                  <PlanRow key={plan.id} plan={plan} editingPlanId={editingPlanId} setEditingPlanId={setEditingPlanId} updatePlan={updatePlan} deletePlan={deletePlan} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const PlanRow = ({ plan, editingPlanId, setEditingPlanId, updatePlan, deletePlan }: {
  plan: PricingPlan;
  editingPlanId: string | null;
  setEditingPlanId: (id: string | null) => void;
  updatePlan: (id: string, field: keyof PricingPlan, value: unknown) => void;
  deletePlan: (id: string) => void;
}) => {
  const isEditing = editingPlanId === plan.id;
  const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));

  return (
    <div className={`rounded-xl border p-4 transition-colors ${isEditing ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-700 bg-black/20'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Title" value={plan.title} onChange={v => updatePlan(plan.id, 'title', v)} />
              <Field label="Price (₹)" value={String(plan.priceINR)} type="number" onChange={v => updatePlan(plan.id, 'priceINR', Number(v))} />
              <Field label="Button text" value={plan.buttonText} onChange={v => updatePlan(plan.id, 'buttonText', v)} />
              <div className="flex items-center gap-2 mt-4">
                <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={plan.popular} onChange={e => updatePlan(plan.id, 'popular', e.target.checked)} className="h-4 w-4" />
                  <Star className="w-3.5 h-3.5 text-yellow-400" /> Popular
                </label>
              </div>
              <div className="md:col-span-2">
                <Field label="Description" value={plan.description} onChange={v => updatePlan(plan.id, 'description', v)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Features (one per line)" value={featuresText} onChange={setFeaturesText}
                  onBlur={() => updatePlan(plan.id, 'features', featuresText.split('\n').map(f => f.trim()).filter(Boolean))} rows={4} />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{plan.title}</span>
                  {plan.popular && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> Popular</span>}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">{plan.description}</div>
              </div>
              <div className="text-xl font-bold text-blue-300">₹{plan.priceINR}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditingPlanId(isEditing ? null : plan.id)}
            className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button onClick={() => deletePlan(plan.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DiscountsTab = ({ config, discounts, persistDiscounts, codeDraft, setCodeDraft, showCodeForm, setShowCodeForm, notify }: {
  config: SiteConfig;
  discounts: DiscountCode[];
  persistDiscounts: (codes: DiscountCode[]) => void;
  codeDraft: Omit<DiscountCode, 'id' | 'usedCount' | 'createdAt'>;
  setCodeDraft: React.Dispatch<React.SetStateAction<typeof codeDraft>>;
  showCodeForm: boolean;
  setShowCodeForm: (v: boolean) => void;
  notify: (m: string) => void;
}) => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [allPlans, setAllPlans] = useState(true);

  const createCode = () => {
    if (!codeDraft.code.trim()) { notify('Code string is required.'); return; }
    if (discounts.find(d => d.code.toLowerCase() === codeDraft.code.toLowerCase())) { notify('A code with this name already exists.'); return; }
    const newCode: DiscountCode = {
      id: uid(), ...codeDraft,
      code: codeDraft.code.toUpperCase().trim(),
      planIds: allPlans ? null : selectedPlans.length ? selectedPlans : null,
      usedCount: 0, createdAt: new Date().toISOString(),
    };
    persistDiscounts([...discounts, newCode]);
    setCodeDraft(emptyCodeDraft()); setSelectedPlans([]); setAllPlans(true); setShowCodeForm(false);
    notify(`Code "${newCode.code}" created.`);
  };

  const updateDraft = (field: string, value: unknown) => setCodeDraft(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-blue-400" /> Discount Codes</h2>
          <p className="text-sm text-gray-400 mt-0.5">Create percentage or fixed-amount discount codes.</p>
        </div>
        <button onClick={() => setShowCodeForm(!showCodeForm)}
          className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
          {showCodeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCodeForm ? 'Cancel' : 'New Code'}
        </button>
      </div>

      {showCodeForm && (
        <div className="bg-gray-800/60 rounded-2xl border border-blue-500/30 p-5 space-y-4">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Create Discount Code</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Code (e.g. SAVE20)" value={codeDraft.code} onChange={v => updateDraft('code', v.toUpperCase())} />
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Type</label>
              <select value={codeDraft.type} onChange={(e: ChangeEvent<HTMLSelectElement>) => updateDraft('type', e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm outline-none focus:border-blue-500">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <Field label={codeDraft.type === 'percentage' ? 'Discount %' : 'Discount ₹'} value={String(codeDraft.value)} type="number" onChange={v => updateDraft('value', Number(v))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Expiry Date</label>
              <input type="date" value={codeDraft.expiresAt ?? ''} onChange={e => updateDraft('expiresAt', e.target.value || null)}
                className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">Max Uses (blank = unlimited)</label>
              <input type="number" min="1" value={codeDraft.maxUses ?? ''} onChange={e => updateDraft('maxUses', e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 100" className="w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <Field label="Description / note (admin only)" value={codeDraft.description} onChange={v => updateDraft('description', v)} />
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">Applicable Plans</label>
            <div className="flex gap-3 mb-3">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setAllPlans(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${allPlans === v ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {v ? 'All Plans' : 'Specific Plans'}
                </button>
              ))}
            </div>
            {!allPlans && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {config.pricing.plans.map(plan => (
                  <label key={plan.id} className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${selectedPlans.includes(plan.id) ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                    <input type="checkbox" checked={selectedPlans.includes(plan.id)} onChange={() => setSelectedPlans(prev => prev.includes(plan.id) ? prev.filter(p => p !== plan.id) : [...prev, plan.id])} className="h-4 w-4" />
                    {plan.title}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={createCode} className="bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Create Code
          </button>
        </div>
      )}

      {discounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><Tag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No discount codes yet.</p></div>
      ) : (
        <div className="space-y-3">
          {discounts.map(code => (
            <div key={code.id} className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center gap-4 bg-gray-800/50 border-gray-700 ${!code.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg tracking-wider">{code.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${code.type === 'percentage' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
                    {code.type === 'percentage' ? `${code.value}% off` : `₹${code.value} off`}
                  </span>
                  {!code.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Inactive</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span>Used: <strong className="text-white">{code.usedCount}</strong>{code.maxUses ? `/${code.maxUses}` : '/∞'}</span>
                  {code.expiresAt && <span>Expires: <strong className="text-white">{code.expiresAt}</strong></span>}
                  {code.description && <span className="italic text-gray-500">{code.description}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => persistDiscounts(discounts.map(d => d.id === code.id ? { ...d, isActive: !d.isActive } : d))}
                  className={`p-2 rounded-lg transition-colors ${code.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}>
                  {code.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => { persistDiscounts(discounts.filter(d => d.id !== code.id)); notify('Code deleted.'); }}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusTab = ({ config, save }: { config: SiteConfig; save: (u: (c: SiteConfig) => SiteConfig) => void }) => (
  <div className="space-y-4">
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Service Status</h2>
      <Field label="Overall status message" value={config.status.overall} onChange={v => save(c => ({ ...c, status: { ...c.status, overall: v } }))} />
    </div>
    {config.status.services.map((svc, i) => (
      <div key={i} className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Service name" value={svc.name} onChange={v => save(c => ({ ...c, status: { ...c.status, services: c.status.services.map((s, idx) => idx === i ? { ...s, name: v } : s) } }))} />
          <Field label="Description" value={svc.description} onChange={v => save(c => ({ ...c, status: { ...c.status, services: c.status.services.map((s, idx) => idx === i ? { ...s, description: v } : s) } }))} />
        </div>
        <label className="text-xs text-gray-400 uppercase tracking-widest block">
          Status
          <select value={svc.status}
            onChange={e => save(c => ({ ...c, status: { ...c.status, services: c.status.services.map((s, idx) => idx === i ? { ...s, status: e.target.value as ServiceStatus } : s) } }))}
            className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm outline-none focus:border-blue-500">
            {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <div className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${svc.status === 'Operational' ? 'bg-green-500/10 text-green-400' : svc.status === 'Under Maintenance' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
          {svc.status === 'Operational' ? <CheckCircle2 className="w-4 h-4" /> : svc.status === 'Under Maintenance' ? <Wrench className="w-4 h-4" /> : svc.status === 'Major Outage' ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {svc.status}
        </div>
      </div>
    ))}
  </div>
);

const SettingsTab = ({ config, save }: { config: SiteConfig; save: (u: (c: SiteConfig) => SiteConfig) => void }) => (
  <div className="space-y-6">
    <section className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings2 className="w-5 h-5 text-blue-400" /> Branding</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Brand name" value={config.branding.name} onChange={v => save(c => ({ ...c, branding: { ...c.branding, name: v } }))} />
        <Field label="Short name" value={config.branding.shortName} onChange={v => save(c => ({ ...c, branding: { ...c.branding, shortName: v } }))} />
        <Field label="Support email" value={config.branding.supportEmail} onChange={v => save(c => ({ ...c, branding: { ...c.branding, supportEmail: v } }))} />
        <Field label="Logo URL" value={config.branding.logo} onChange={v => save(c => ({ ...c, branding: { ...c.branding, logo: v } }))} />
        <div className="md:col-span-2">
          <Textarea label="Tagline" value={config.branding.tagline} onChange={v => save(c => ({ ...c, branding: { ...c.branding, tagline: v } }))} rows={2} />
        </div>
      </div>
    </section>

    <section className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
      <h2 className="font-bold text-lg mb-4">Auth</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Discord client ID" value={config.auth.discordClientId} onChange={v => save(c => ({ ...c, auth: { ...c.auth, discordClientId: v } }))} />
        <Field label="Discord redirect URI" value={config.auth.discordRedirectUri} onChange={v => save(c => ({ ...c, auth: { ...c.auth, discordRedirectUri: v } }))} />
        <Field label="Discord bot token" value={config.auth.discordBotToken} onChange={v => save(c => ({ ...c, auth: { ...c.auth, discordBotToken: v } }))} />
        <Field label="Discord client secret" value={config.auth.discordClientSecret} onChange={v => save(c => ({ ...c, auth: { ...c.auth, discordClientSecret: v } }))} />
        <Field label="Verification URL" value={config.payment.verificationUrl} onChange={v => save(c => ({ ...c, payment: { ...c.payment, verificationUrl: v } }))} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Toggle label="Manual login" checked={config.auth.allowManualLogin} onChange={v => save(c => ({ ...c, auth: { ...c.auth, allowManualLogin: v } }))} />
        <Toggle label="Discord login" checked={config.auth.allowDiscordLogin} onChange={v => save(c => ({ ...c, auth: { ...c.auth, allowDiscordLogin: v } }))} />
        <Toggle label="Auto create user on payment" checked={config.payment.autoCreateUser} onChange={v => save(c => ({ ...c, payment: { ...c.payment, autoCreateUser: v } }))} />
        <Toggle label="Auto provision server" checked={config.payment.autoProvisionServer} onChange={v => save(c => ({ ...c, payment: { ...c.payment, autoProvisionServer: v } }))} />
      </div>
    </section>

    <section className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5">
      <h2 className="font-bold text-lg mb-4">Payment</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Provider name" value={config.payment.providerName} onChange={v => save(c => ({ ...c, payment: { ...c.payment, providerName: v } }))} />
        <Field label="Currency code" value={config.payment.currency} onChange={v => save(c => ({ ...c, payment: { ...c.payment, currency: v } }))} />
        <Field label="Min. order amount (₹)" value={String(config.payment.minimumOrderAmount)} type="number" onChange={v => save(c => ({ ...c, payment: { ...c.payment, minimumOrderAmount: Number(v) } }))} />
      </div>
    </section>
  </div>
);

const StatCard = ({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub: string; color?: string }) => (
  <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
    <div className="text-sm text-gray-400">{label}</div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) => (
  <label className="text-xs text-gray-400 uppercase tracking-widest block">
    {label}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
  </label>
);

const Textarea = ({ label, value, onChange, rows = 3, onBlur }: { label: string; value: string; onChange: (v: string) => void; rows?: number; onBlur?: () => void }) => (
  <label className="text-xs text-gray-400 uppercase tracking-widest block">
    {label}
    <textarea value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} rows={rows}
      className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none" />
  </label>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-black/20 px-4 py-3 text-sm text-gray-200 cursor-pointer hover:bg-gray-800/50 transition-colors">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5 accent-blue-500" />
  </label>
);

export default AdminPage;
