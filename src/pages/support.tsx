import { useState, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, MessageSquare, BookOpen, ChevronDown, Send, CheckCircle2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { loadSession, loadTickets, saveTickets, uid, type TicketCategory, type TicketPriority } from '../lib/dashboardStore';

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-700">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4 px-2">
        <span className="font-semibold text-lg">{question}</span>
        <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-4 px-2 text-gray-300">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing / Payment' },
  { value: 'general', label: 'General Question' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: TicketPriority; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'General question, no urgency' },
  { value: 'medium', label: 'Medium', desc: 'Service issue, not critical' },
  { value: 'high', label: 'High', desc: 'Service down or critical bug' },
];

const Support = () => {
  const { config } = useSiteConfig();
  const session = loadSession();

  const [form, setForm] = useState({
    email: session?.email ?? '',
    subject: '',
    category: 'technical' as TicketCategory,
    priority: 'medium' as TicketPriority,
    message: '',
  });
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Email, subject and message are required.');
      return;
    }
    const ticketId = `TKT-${uid().toUpperCase()}`;
    const now = new Date().toISOString();
    const ticket = {
      id: ticketId,
      email: form.email.trim(),
      subject: form.subject.trim(),
      category: form.category,
      status: 'open' as const,
      priority: form.priority,
      createdAt: now,
      updatedAt: now,
      messages: [{
        id: uid(),
        from: 'user' as const,
        text: form.message.trim(),
        createdAt: now,
      }],
    };
    saveTickets([...loadTickets(), ticket]);
    setSubmitted(ticketId);
    setError('');
    setForm({ email: session?.email ?? '', subject: '', category: 'technical', priority: 'medium', message: '' });
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <LifeBuoy className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Help <span className="text-blue-400">Center</span></h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Submit a support ticket, browse the knowledge base, or check your existing tickets.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.button
            onClick={() => setShowForm(true)}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl flex flex-col items-center text-center border border-gray-700 hover:border-blue-500 hover:bg-gray-800/70 transition-all"
          >
            <MessageSquare className="w-12 h-12 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Open a Ticket</h2>
            <p className="text-gray-400 text-sm">Get personalized help from our support team.</p>
          </motion.button>

          <motion.a
            href={config.support.docsUrl} target="_blank" rel="noreferrer"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl flex flex-col items-center text-center border border-gray-700 hover:border-blue-500 hover:bg-gray-800/70 transition-all"
          >
            <BookOpen className="w-12 h-12 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Knowledge Base</h2>
            <p className="text-gray-400 text-sm">Guides, setup notes, and order instructions.</p>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <Link to="/tickets" className="block bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl flex flex-col items-center text-center border border-gray-700 hover:border-blue-500 hover:bg-gray-800/70 transition-all h-full">
              <Ticket className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">My Tickets</h2>
              <p className="text-gray-400 text-sm">View status and replies on your tickets.</p>
            </Link>
          </motion.div>
        </div>

        <AnimatePresence>
          {showForm && !submitted && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6 md:p-8 mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-400" /> Submit a Support Ticket
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest">
                    Your Email *
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com"
                      className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                  </label>
                  <label className="block text-xs text-gray-400 uppercase tracking-widest">
                    Subject *
                    <input type="text" value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="Brief description of your issue"
                      className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest">
                    Category
                    <select value={form.category} onChange={(e: ChangeEvent<HTMLSelectElement>) => update('category', e.target.value)}
                      className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </label>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">Priority</p>
                    <div className="flex gap-2">
                      {PRIORITIES.map(p => (
                        <button key={p.value} type="button" onClick={() => update('priority', p.value)}
                          title={p.desc}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${form.priority === p.value
                            ? p.value === 'high' ? 'bg-red-600 border-red-500 text-white'
                              : p.value === 'medium' ? 'bg-yellow-600 border-yellow-500 text-white'
                              : 'bg-green-700 border-green-600 text-white'
                            : 'bg-black/30 border-gray-700 text-gray-400 hover:text-white'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="block text-xs text-gray-400 uppercase tracking-widest">
                  Message *
                  <textarea value={form.message} onChange={e => update('message', e.target.value)}
                    rows={5} placeholder="Describe your issue in detail…"
                    className="mt-1.5 w-full rounded-xl bg-black/40 border border-gray-700 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none" />
                </label>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-xl font-semibold">
                  <Send className="w-4 h-4" /> Submit Ticket
                </button>
              </form>
            </motion.div>
          )}

          {submitted && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center mb-16">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ticket Submitted!</h2>
              <p className="text-gray-300 mb-1">Your ticket ID is:</p>
              <p className="text-3xl font-mono font-bold text-green-400 mb-4">{submitted}</p>
              <p className="text-gray-400 text-sm mb-6">Save this ID. You can track your ticket status on the <strong>My Tickets</strong> page.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/tickets" className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  View My Tickets
                </Link>
                <button onClick={() => { setSubmitted(null); setShowForm(true); }}
                  className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Submit Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center mb-10">
            Frequently Asked Questions
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            {config.support.faq.map(faq => <FaqItem key={faq.question} {...faq} />)}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Support;
