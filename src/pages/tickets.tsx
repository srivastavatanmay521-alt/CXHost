import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ChevronDown, ChevronUp, Send, Clock, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadSession, loadTickets, saveTickets, uid, type Ticket as TicketType, type TicketStatus } from '../lib/dashboardStore';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Open', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: AlertCircle },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400 border-gray-600', icon: XCircle },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const TicketCard = ({ ticket, onReply }: { ticket: TicketType; onReply: (id: string, text: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const status = STATUS_CONFIG[ticket.status];
  const StatusIcon = status.icon;

  const handleReply = (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    onReply(ticket.id, reply.trim());
    setReply('');
  };

  return (
    <div className={`rounded-2xl border bg-gray-800/50 backdrop-blur-sm transition-colors ${open ? 'border-blue-500/40' : 'border-gray-700'}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left p-5 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
            <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[ticket.priority]}`}>
              {ticket.priority} priority
            </span>
            <span className="text-xs text-gray-500 capitalize bg-gray-700/50 px-2 py-0.5 rounded-full">{ticket.category}</span>
          </div>
          <h3 className="font-bold text-base">{ticket.subject}</h3>
          <p className="text-xs text-gray-500 mt-1">{fmt(ticket.createdAt)} · {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-gray-700 pt-4 space-y-3">
              {ticket.messages.map(msg => (
                <div key={msg.id} className={`rounded-xl p-4 text-sm ${msg.from === 'user' ? 'bg-blue-500/10 border border-blue-500/20 ml-0 mr-8' : 'bg-gray-700/60 border border-gray-600 ml-8 mr-0'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {msg.from === 'user' ? 'You' : '⚡ Support Team'}
                    </span>
                    <span className="text-xs text-gray-500">{fmt(msg.createdAt)}</span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}

              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <form onSubmit={handleReply} className="flex gap-2 mt-4">
                  <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to this ticket…"
                    className="flex-1 rounded-xl bg-black/40 border border-gray-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors">
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              )}

              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <p className="text-center text-sm text-gray-500 py-2">This ticket is {ticket.status}. Open a new ticket if you need further help.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketsPage = () => {
  const session = loadSession();
  const [emailInput, setEmailInput] = useState('');
  const [searchEmail, setSearchEmail] = useState(session?.email ?? '');
  const [tickets, setTickets] = useState<TicketType[]>(() => loadTickets());

  const myTickets = searchEmail
    ? tickets.filter(t => t.email.toLowerCase() === searchEmail.toLowerCase())
    : [];

  const handleAddReply = (ticketId: string, text: string) => {
    const now = new Date().toISOString();
    const updated = tickets.map(t =>
      t.id === ticketId
        ? { ...t, updatedAt: now, messages: [...t.messages, { id: uid(), from: 'user' as const, text, createdAt: now }] }
        : t
    );
    saveTickets(updated);
    setTickets(updated);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <Ticket className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold">My Tickets</h1>
          </div>
          <p className="text-gray-400 ml-11">Enter your email to view all support tickets tied to your account.</p>
        </motion.div>

        <div className="flex gap-2 mb-8">
          <input
            value={emailInput || searchEmail}
            onChange={e => { setEmailInput(e.target.value); setSearchEmail(''); }}
            placeholder="your@email.com"
            className="flex-1 rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          />
          <button onClick={() => { setSearchEmail(emailInput || searchEmail); }}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <Clock className="w-4 h-4" /> Load Tickets
          </button>
        </div>

        {searchEmail && myTickets.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 bg-gray-800/40 rounded-2xl border border-gray-700">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No tickets found for <strong className="text-white">{searchEmail}</strong></p>
            <p className="text-gray-500 text-sm mt-1">Have an issue? Submit a ticket from the Support page.</p>
            <Link to="/support" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Open Support
            </Link>
          </motion.div>
        )}

        {myTickets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400"><strong className="text-white">{myTickets.length}</strong> ticket{myTickets.length !== 1 ? 's' : ''} for {searchEmail}</p>
              <Link to="/support" className="text-sm text-blue-400 hover:underline">+ New Ticket</Link>
            </div>
            {myTickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onReply={handleAddReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
