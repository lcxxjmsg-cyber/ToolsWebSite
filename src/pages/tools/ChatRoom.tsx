import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Copy, Check, Clock, Users, ArrowLeft, AlertTriangle, Key, ChevronDown } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useLangStore } from '../../store/langStore';
import { encryptWithKey, decryptWithKey, generateKey } from '../../utils/crypto';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const TTL_OPTIONS = [
  { value: 3600, key: 'chat.create.expire.1hour' },
  { value: 86400, key: 'chat.create.expire.24hour' },
  { value: 604800, key: 'chat.create.expire.7day' },
];

const POLL_INTERVAL = 3000;
const MAX_MSG_LEN = 4096;
const TTL_WARN = 300;

const NICK_KEY = 'chat_nick';

const NICK_POOLS: Record<string, { adjs: string[]; animals: string[] }> = {
  'zh-CN': {
    adjs: ['迅捷', '安静', '勇敢', '沉稳', '轻盈', '深邃', '野性', '机敏', '明亮', '幽暗', '灵动', '温和', '温暖', '柔软', '清冷'],
    animals: ['狐', '猞', '熊', '狼', '鹿', '鹰', '鼬', '羚', '鹤', '豹', '貂', '雁', '鸢', '鹏', '鸾'],
  },
  'ja': {
    adjs: ['疾風', '静寂', '勇壮', '優雅', '清澄', '深淵', '孤高', '敏捷', '璀璨', '幽玄', '爽快', '温厚'],
    animals: ['狐', '山猫', '熊', '狼', '鹿', '鷲', '鼬', '羚', '鶴', '豹', '貂', '鷹'],
  },
  'en': {
    adjs: ['Swift', 'Quiet', 'Bold', 'Calm', 'Brisk', 'Cool', 'Deep', 'Wild', 'Sharp', 'Sly', 'Bright', 'Dark', 'Fleet', 'Grand', 'Keen', 'Lucky', 'Neat', 'Prime', 'Rare', 'Safe', 'Lean', 'Fast', 'Soft', 'Warm', 'Crisp', 'Noble', 'Wise', 'Zest'],
    animals: ['Fox', 'Lynx', 'Owl', 'Bear', 'Wolf', 'Deer', 'Hawk', 'Mole', 'Crab', 'Dove', 'Fawn', 'Goat', 'Hare', 'Lion', 'Moose', 'Newt', 'Puma', 'Quail', 'Seal', 'Viper', 'Wren', 'Zebra', 'Bat', 'Ram', 'Toad', 'Wasp'],
  },
  'ko': {
    adjs: ['날쌘', '고요한', '용감한', '차분한', '가벼운', '깊은', '야생의', '날카로운', '밝은', '어두운', '온화한', '따뜻한'],
    animals: ['여우', '스라소니', '곰', '늑대', '사슴', '매', '족제비', '영양', '두루미', '표범', '담비'],
  },
  'es': {
    adjs: ['Rápido', 'Tranquilo', 'Audaz', 'Sereno', 'Ligero', 'Profundo', 'Salvaje', 'Agudo', 'Brillante', 'Oscuro', 'Suave', 'Cálido'],
    animals: ['Zorro', 'Lince', 'Búho', 'Oso', 'Lobo', 'Ciervo', 'Halcón', 'Topo', 'Cabra', 'Liebre', 'León', 'Foca'],
  },
  'fr': {
    adjs: ['Rapide', 'Calme', 'Audacieux', 'Serein', 'Léger', 'Profond', 'Sauvage', 'Vif', 'Luisant', 'Sombre', 'Doux', 'Chaud'],
    animals: ['Renard', 'Lynx', 'Hibou', 'Ours', 'Loup', 'Cerf', 'Faucon', 'Taupe', 'Chèvre', 'Lièvre', 'Lion', 'Phoque'],
  },
  'de': {
    adjs: ['Schnell', 'Ruhig', 'Mutig', 'Gelassen', 'Leicht', 'Tief', 'Wild', 'Scharf', 'Hell', 'Dunkel', 'Sanft', 'Warm'],
    animals: ['Fuchs', 'Luchs', 'Eule', 'Bär', 'Wolf', 'Hirsch', 'Falke', 'Maulwurf', 'Ziege', 'Hase', 'Löwe', 'Robbe'],
  },
  'pt': {
    adjs: ['Rápido', 'Calmo', 'Audaz', 'Sereno', 'Leve', 'Profundo', 'Selvagem', 'Agudo', 'Brilhante', 'Escuro', 'Suave', 'Quente'],
    animals: ['Raposa', 'Lince', 'Coruja', 'Urso', 'Lobo', 'Cervo', 'Falcão', 'Toupeira', 'Cabra', 'Lebre', 'Leão', 'Foca'],
  },
  'ru': {
    adjs: ['Быстрый', 'Тихий', 'Смелый', 'Спокойный', 'Лёгкий', 'Глубокий', 'Дикий', 'Острый', 'Яркий', 'Тёмный', 'Мягкий', 'Тёплый'],
    animals: ['Лис', 'Рысь', 'Сова', 'Медведь', 'Волк', 'Олень', 'Сокол', 'Крот', 'Коза', 'Заяц', 'Лев', 'Тюлень'],
  },
};

function getMyNick(): string {
  let nick = localStorage.getItem(NICK_KEY);
  if (!nick) {
    const lang = useLangStore.getState().lang;
    const pool = NICK_POOLS[lang] || NICK_POOLS['en'];
    const a = pool.adjs[Math.floor(Math.random() * pool.adjs.length)];
    const b = pool.animals[Math.floor(Math.random() * pool.animals.length)];
    nick = a + b;
    localStorage.setItem(NICK_KEY, nick);
  }
  return nick;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

function linkify(text: string): (string | React.ReactNode)[] {
  return text.split(/(https?:\/\/[^\s<]+)/g).map((part, i) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">{part}</a>;
    }
    return part;
  });
}

function formatDateGroup(ts: number): string | null {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return null;
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  encrypted: boolean;
}

interface StoredMsg {
  id: string;
  ciphertext: string;
  iv: string;
  timestamp: number;
}

export default function ChatRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useT();
  const myNick = useRef(getMyNick());

  const [mode, setMode] = useState<'create' | 'loading' | 'chat' | 'notfound' | 'error'>('create');
  const [ttl, setTtl] = useState(86400);
  const [resultUrl, setResultUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [roomInfo, setRoomInfo] = useState<{ createdAt: number; ttl: number; ttlRemaining: number } | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const roomKeyRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastTimestampRef = useRef(0);
  const msgCountRef = useRef(0);

  useEffect(() => {
    if (!roomId) { setMode('create'); return; }
    const keyFromHash = window.location.hash.slice(1);
    if (!keyFromHash) { setMode('error'); setErrorMsg(t('chat.error.noKey')); return; }
    roomKeyRef.current = keyFromHash;
    joinRoom();
  }, [roomId]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setIsAtBottom(true);
  }

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('auto');
    }
  }, [messages.length, isAtBottom]);

  async function joinRoom() {
    setMode('loading');
    try {
      const res = await fetch(`/api/chat/room/${roomId}`);
      if (res.status === 404) { setMode('notfound'); return; }
      if (!res.ok) { setMode('error'); setErrorMsg(t('chat.error.loadFailed')); return; }

      const data = await res.json();
      setRoomInfo({ createdAt: data.createdAt, ttl: data.ttl, ttlRemaining: data.ttlRemaining });
      const decrypted = await decryptMessages(data.messages);
      setMessages(decrypted);
      msgCountRef.current = decrypted.length;
      if (data.messages.length > 0) lastTimestampRef.current = data.messages[data.messages.length - 1].timestamp;
      setMode('chat');
      pollRef.current = setInterval(pollMessages, POLL_INTERVAL);
    } catch { setMode('error'); setErrorMsg(t('chat.error.loadFailed')); }
  }

  async function pollMessages() {
    try {
      const res = await fetch(`/api/chat/room/${roomId}`);
      if (!res.ok) { if (res.status === 404) { setMode('notfound'); if (pollRef.current) clearInterval(pollRef.current); } return; }

      const data = await res.json();
      setRoomInfo({ createdAt: data.createdAt, ttl: data.ttl, ttlRemaining: data.ttlRemaining });
      const newStored = data.messages.filter((m: StoredMsg) => m.timestamp > lastTimestampRef.current);
      if (newStored.length > 0) {
        lastTimestampRef.current = newStored[newStored.length - 1].timestamp;
        const decrypted = await decryptMessages(newStored);
        setMessages((prev) => [...prev, ...decrypted]);
        const hasOthers = decrypted.some((m) => m.sender !== myNick.current);
        if (hasOthers && !isAtBottom) {
          if (document.hidden) playBeep();
        }
      }
    } catch {}
  }

  const participantCount = useMemo(() => {
    const unique = new Set(messages.map((m) => m.sender));
    return Math.max(1, unique.size);
  }, [messages]);

  async function decryptMessages(stored: StoredMsg[]): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    for (const msg of stored) {
      try {
        const plain = await decryptWithKey(msg.ciphertext, msg.iv, roomKeyRef.current);
        let parsed: { text: string; sender?: string };
        try { parsed = JSON.parse(plain); } catch { parsed = { text: plain }; }
        results.push({ id: msg.id, text: parsed.text, sender: parsed.sender || 'Anonymous', timestamp: msg.timestamp, encrypted: false });
      } catch {
        results.push({ id: msg.id, text: '[Decryption failed]', sender: 'Unknown', timestamp: msg.timestamp, encrypted: true });
      }
    }
    return results;
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/chat/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: ttl }),
      });
      if (!res.ok) throw new Error();
      const { id } = await res.json();
      setResultUrl(`${window.location.origin}/tools/chat/${id}#${generateKey()}`);
    } catch { setErrorMsg(t('chat.error.createFailed')); }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const payload = JSON.stringify({ text, sender: myNick.current });
      const encrypted = await encryptWithKey(payload, roomKeyRef.current);
      const res = await fetch(`/api/chat/room/${roomId}/msg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext: encrypted.ciphertext, iv: encrypted.iv }),
      });
      if (!res.ok) throw new Error();
      const { id, timestamp } = await res.json();
      setMessages((prev) => [...prev, { id, text, sender: myNick.current, timestamp, encrypted: false }]);
      lastTimestampRef.current = timestamp;
      setInput('');
    } catch { setErrorMsg(t('chat.error.sendFailed')); }
    finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(resultUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  function handleCopyMessage(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function formatTTL(seconds: number): string {
    if (seconds <= 0) return t('chat.expired');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  // ---- Render helpers ----

  function renderMessages() {
    if (messages.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t('chat.empty')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('chat.empty.hint')}</p>
        </div>
      );
    }

    const rendered: React.ReactNode[] = [];

    messages.forEach((msg, idx) => {
      const dateLabel = formatDateGroup(msg.timestamp);
      if (dateLabel) {
        rendered.push(
          <div key={`date-${idx}`} className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{dateLabel}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
        );
      }

      const isMe = msg.sender === myNick.current;
      rendered.push(
        <div key={msg.id} className="group flex items-end gap-1.5" style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row' }}>
          <div className="max-w-[80%] relative">
            {!isMe && <p className="text-xs text-slate-400 mb-0.5 px-1">{msg.sender}</p>}
            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.encrypted
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500 italic'
                : isMe
                  ? 'bg-violet-500 text-white rounded-br-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md'
            }`}>
              {msg.encrypted ? msg.text : linkify(msg.text)}
            </div>
            <p className={`text-[10px] text-slate-400 mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
              {formatTime(msg.timestamp)}
            </p>
          </div>
          <button
            onClick={() => handleCopyMessage(msg.text)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    });

    return rendered;
  }

  // ---- Render modes ----

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
        <Header />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
          <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />{t('nav.tools')}
          </button>
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('chat.title')}</h1>
                <p className="text-sm text-slate-500">{t('chat.subtitle')}</p>
              </div>
            </div>
            {!resultUrl ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />{t('chat.create.expire')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TTL_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setTtl(opt.value)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${ttl === opt.value ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed"><Key className="w-3.5 h-3.5 inline mr-1" />{t('chat.create.security')}</p>
                {errorMsg && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{errorMsg}</p>}
                <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />{t('chat.create.btn')}
                </button>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"><Check className="w-7 h-7 text-emerald-500" /></div>
                <div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('chat.created')}</h2><p className="text-sm text-slate-500 mt-1">{t('chat.created.desc')}</p></div>
                <div className="flex gap-2">
                  <input readOnly value={resultUrl} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono select-all" />
                  <button onClick={handleCopyUrl} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-1.5">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setResultUrl('')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{t('chat.create.another')}</button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button onClick={() => window.open(resultUrl, '_blank')} className="text-sm text-violet-500 hover:text-violet-600 transition-colors">{t('chat.create.join')}</button>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (mode === 'loading') return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <span className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="mt-4 text-sm text-slate-500">{t('chat.joining')}</p>
        </div>
      </main>
    </div>
  );

  if (mode === 'notfound') return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 max-w-md">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('chat.notfound')}</h2>
          <p className="text-sm text-slate-500 mb-6">{t('chat.notfound.desc')}</p>
          <button onClick={() => navigate('/tools/chat')} className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors">{t('chat.create.btn')}</button>
        </div>
      </main>
    </div>
  );

  if (mode === 'error') return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('burn.read.errorTitle')}</h2>
          <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
          <button onClick={() => navigate('/tools/chat')} className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors">{t('chat.create.btn')}</button>
        </div>
      </main>
    </div>
  );

  // ---- Chat mode ----
  const ttlWarn = roomInfo && roomInfo.ttlRemaining < TTL_WARN;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      {/* Room info bar */}
      <div className="pt-20 pb-0 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl border border-b-0 transition-colors ${
          ttlWarn
            ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-[#141414] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${ttlWarn ? 'text-amber-500' : 'text-violet-500'}`} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('chat.room')}</span>
            <span className="text-xs text-slate-400 font-mono">{roomId?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {roomInfo && (
              <span className={`flex items-center gap-1 ${ttlWarn ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3" />
                {formatTTL(roomInfo.ttlRemaining)}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Users className="w-3 h-3" />
              {participantCount}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full overflow-hidden relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full bg-white dark:bg-[#141414] border-x border-slate-200 dark:border-slate-800 px-4 py-4 overflow-y-auto space-y-2"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-violet-500 text-white text-xs font-medium shadow-lg hover:bg-violet-600 transition-all flex items-center gap-1.5 animate-fade-in"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            {t('chat.newMsg')}
          </button>
        )}
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full pb-6">
        <div className="bg-white dark:bg-[#141414] rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-800 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MSG_LEN))}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.input.placeholder')}
              rows={1}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 self-end"
            >
              {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{t('chat.nick.as')} {myNick.current}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{t('chat.encrypted')}</span>
            </div>
            <span className={`text-xs ${input.length > MAX_MSG_LEN - 100 ? 'text-amber-500' : 'text-slate-400'}`}>
              {input.length}/{MAX_MSG_LEN}
            </span>
          </div>

          {errorMsg && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}
