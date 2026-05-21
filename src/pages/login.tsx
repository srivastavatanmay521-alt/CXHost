import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Github, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { saveSession } from '../lib/dashboardStore';

const Login = () => {
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'discord'>('manual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const discordAuthUrl = useMemo(() => {
    if (!config.auth.discordClientId) {
      return '';
    }
    const params = new URLSearchParams({
      client_id: config.auth.discordClientId,
      redirect_uri: config.auth.discordRedirectUri,
      response_type: 'code',
      scope: 'identify email',
      prompt: 'consent',
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }, [config.auth.discordClientId, config.auth.discordRedirectUri]);

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage('Enter an email and password.');
      return;
    }

    saveSession({ email, loginMethod: 'manual' });
    setMessage('Signed in successfully.');
    navigate(config.auth.manualLoginRedirect);
  };

  const startDiscordLogin = () => {
    if (discordAuthUrl) {
      window.location.href = discordAuthUrl;
      return;
    }

    setMessage('Discord login needs a client ID in config.js and a backend callback to complete the OAuth exchange.');
  };

  const continueWithDemoDiscord = () => {
    if (!handle) {
      setMessage('Add your Discord handle or email first.');
      return;
    }

    saveSession({ email: handle, loginMethod: 'discord' });
    setMessage('Discord session stored locally for demo/testing.');
    navigate(config.auth.manualLoginRedirect);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold">{config.branding.name} Login</h1>
          <p className="text-gray-300 mt-3">Choose a manual login or connect Discord.</p>
        </motion.div>

        <div className="flex justify-center gap-3 mb-8">
          <button type="button" onClick={() => setMode('manual')} className={`px-4 py-2 rounded-full border ${mode === 'manual' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-300'}`} disabled={!config.auth.allowManualLogin}>
            Manual login
          </button>
          <button type="button" onClick={() => setMode('discord')} className={`px-4 py-2 rounded-full border ${mode === 'discord' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-300'}`} disabled={!config.auth.allowDiscordLogin}>
            Discord login
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Manual</p>
                <h2 className="text-2xl font-bold">Email and password</h2>
              </div>
              <Mail className="w-6 h-6 text-blue-400" />
            </div>

            <form className="space-y-4" onSubmit={submitManual}>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2" disabled={!config.auth.allowManualLogin}>
                <LogIn className="w-5 h-5" />
                Continue
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Discord</p>
                <h2 className="text-2xl font-bold">Login with Discord</h2>
              </div>
              <Github className="w-6 h-6 text-blue-400" />
            </div>

            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Connect Discord OAuth in your backend using the client ID, bot token, and secret from <code className="text-blue-300">src/config.js</code>.
              </p>

              <input value={handle} onChange={e => setHandle(e.target.value)} type="text" placeholder="Discord handle or email" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <button type="button" onClick={startDiscordLogin} className="w-full bg-gray-700 hover:bg-gray-600 transition-colors rounded-lg px-4 py-3 font-semibold" disabled={!config.auth.allowDiscordLogin}>
                Open Discord OAuth
              </button>
              <button type="button" onClick={continueWithDemoDiscord} className="w-full border border-blue-500 text-blue-300 hover:bg-blue-500/10 transition-colors rounded-lg px-4 py-3 font-semibold" disabled={!config.auth.allowDiscordLogin}>
                Save demo Discord login
              </button>
            </div>
          </motion.div>
        </div>

        {message && (
          <div className="mt-8 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-blue-100">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
