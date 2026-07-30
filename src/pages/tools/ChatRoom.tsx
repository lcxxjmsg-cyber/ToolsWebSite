import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Copy, Check, Clock, Users, ArrowLeft, AlertTriangle, Key } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { encryptWithKey, decryptWithKey, generateKey } from '../../utils/crypto';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const TTL_OPTIONS = [
  { value: 3600, key: 'chat.create.expire.1hour' },
  { value: 86400, key: 'chat.create.expire.24hour' },
  { value: 604800, key: 'chat.create.expire.7day' },
];

const POLL_INTERVAL = 3000;

const NICK_KEY = 'chat_nick';

const ADJS = [
  'Swift', 'Quiet', 'Bold', 'Calm', 'Brisk', 'Cool', 'Deep', 'Wild',
  'Sharp', 'Sly', 'Bright', 'Dark', 'Fleet', 'Grand', 'Keen', 'Lucky',
  'Neat', 'Prime', 'Rare', 'Safe', 'Lean', 'Fast', 'Soft', 'Warm',
  'Crisp', 'Droll', 'Fond', 'Grim', 'Hale', 'Jade', 'Lark', 'Mild',
  'Noble', 'Pert', 'Rife', 'Sage', 'Tidy', 'Vast', 'Wise', 'Zest',
  'Flax', 'Gled', 'Husk', 'Jest', 'Lisp', 'Muse', 'Nock', 'Purl',
];

const ANIMALS = [
  'Fox', 'Lynx', 'Owl', 'Bear', 'Wolf', 'Deer', 'Hawk', 'Mole',
  'Vole', 'Crab', 'Dove', 'Ermine', 'Fawn', 'Goat', 'Hare', 'Ibex',
  'Jackal', 'Koala', 'Lion', 'Moose', 'Newt', 'Oryx', 'Puma', 'Quail',
  'Roan', 'Seal', 'Tahr', 'Urial', 'Viper', 'Wren', 'Yak', 'Zebra',
  'Ape', 'Bat', 'Cod', 'Dab', 'Eel', 'Fry', 'Gnu', 'Hog',
  'Kid', 'Lamb', 'Ram', 'Sole', 'Toad', 'Vole', 'Wasp', 'Yaffle',
];

function getMyNick(): string {
  let nick = localStorage.getItem(NICK_KEY);
  if (!nick) {
    const a = ADJS[Math.floor(Math.random() * ADJS.length)];
    const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    nick = a + b;
    localStorage.setItem(NICK_KEY, nick);
  }
  return nick;
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
  const [participantCount, setParticipantCount] = useState(0);

  const roomKeyRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    if (!roomId) {
      setMode('create');
      return;
    }

    const keyFromHash = window.location.hash.slice(1);
    if (!keyFromHash) {
      setMode('error');
      setErrorMsg(t('chat.error.noKey'));
      return;
    }

    roomKeyRef.current = keyFromHash;
    joinRoom();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function joinRoom() {
    setMode('loading');
    try {
      const res = await fetch(`/api/chat/room/${roomId}`);
      if (res.status === 404) {
        setMode('notfound');
        return;
      }
      if (!res.ok) {
        setMode('error');
        setErrorMsg(t('chat.error.loadFailed'));
        return;
      }

      const data = await res.json();
      setRoomInfo({ createdAt: data.createdAt, ttl: data.ttl, ttlRemaining: data.ttlRemaining });

      const decrypted = await decryptMessages(data.messages);
      setMessages(decrypted);
      if (data.messages.length > 0) {
        lastTimestampRef.current = data.messages[data.messages.length - 1].timestamp;
      }

      setMode('chat');
      updateParticipants(data.messages);

      pollRef.current = setInterval(pollMessages, POLL_INTERVAL);
    } catch {
      setMode('error');
      setErrorMsg(t('chat.error.loadFailed'));
    }
  }

  async function pollMessages() {
    try {
      const res = await fetch(`/api/chat/room/${roomId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setMode('notfound');
          if (pollRef.current) clearInterval(pollRef.current);
        }
        return;
      }

      const data = await res.json();
      setRoomInfo({ createdAt: data.createdAt, ttl: data.ttl, ttlRemaining: data.ttlRemaining });

      const newStored = data.messages.filter((m: StoredMsg) => m.timestamp > lastTimestampRef.current);
      if (newStored.length > 0) {
        lastTimestampRef.current = newStored[newStored.length - 1].timestamp;
        const decrypted = await decryptMessages(newStored);
        setMessages((prev) => [...prev, ...decrypted]);
      }

      updateParticipants(data.messages);
    } catch {}
  }

  function updateParticipants(stored: StoredMsg[]) {
    setParticipantCount(Math.min(Math.ceil(stored.length / 3) + 1, 20));
  }

  async function decryptMessages(stored: StoredMsg[]): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    for (const msg of stored) {
      try {
        const plain = await decryptWithKey(msg.ciphertext, msg.iv, roomKeyRef.current);
        let parsed: { text: string; sender?: string };
        try {
          parsed = JSON.parse(plain);
        } catch {
          parsed = { text: plain };
        }
        results.push({
          id: msg.id,
          text: parsed.text,
          sender: parsed.sender || 'Anonymous',
          timestamp: msg.timestamp,
          encrypted: false,
        });
      } catch {
        results.push({
          id: msg.id,
          text: '[Decryption failed]',
          sender: 'Unknown',
          timestamp: msg.timestamp,
          encrypted: true,
        });
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
      const key = generateKey();
      const url = `${window.location.origin}/tools/chat/${id}#${key}`;
      setResultUrl(url);
    } catch {
      setErrorMsg(t('chat.error.createFailed'));
    }
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
    } catch {
      setErrorMsg(t('chat.error.sendFailed'));
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(resultUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatTTL(seconds: number): string {
    if (seconds <= 0) return t('chat.expired');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
        <Header />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
          <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.tools')}
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
                    <Clock className="w-4 h-4 inline mr-1" />
                    {t('chat.create.expire')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TTL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTtl(opt.value)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          ttl === opt.value
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  <Key className="w-3.5 h-3.5 inline mr-1" />
                  {t('chat.create.security')}
                </p>

                {errorMsg && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{errorMsg}</p>
                )}

                <button
                  onClick={handleCreate}
                  className="w-full py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('chat.create.btn')}
                </button>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('chat.created')}</h2>
                  <p className="text-sm text-slate-500 mt-1">{t('chat.created.desc')}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={resultUrl}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setResultUrl('')}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {t('chat.create.another')}
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    onClick={() => window.open(resultUrl, '_blank')}
                    className="text-sm text-violet-500 hover:text-violet-600 transition-colors"
                  >
                    {t('chat.create.join')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (mode === 'loading') {
    return (
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
  }

  if (mode === 'notfound') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
        <Header />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 max-w-md">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('chat.notfound')}</h2>
            <p className="text-sm text-slate-500 mb-6">{t('chat.notfound.desc')}</p>
            <button
              onClick={() => navigate('/tools/chat')}
              className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
            >
              {t('chat.create.btn')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
        <Header />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('burn.read.errorTitle')}</h2>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/tools/chat')}
              className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
            >
              {t('chat.create.btn')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Chat mode
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      {/* Room info bar */}
      <div className="pt-20 pb-0 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#141414] rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('chat.room')}</span>
            <span className="text-xs text-slate-400 font-mono">{roomId?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {roomInfo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTTL(roomInfo.ttlRemaining)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participantCount}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full overflow-hidden">
        <div className="h-full bg-white dark:bg-[#141414] border-x border-slate-200 dark:border-slate-800 px-4 py-4 overflow-y-auto space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{t('chat.empty')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('chat.empty.hint')}</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender === myNick.current;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  {!isMe && (
                    <p className="text-xs text-slate-400 mb-0.5 px-1">{msg.sender}</p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.encrypted
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-500 italic'
                      : isMe
                        ? 'bg-violet-500 text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-slate-400 mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full pb-6">
        <div className="bg-white dark:bg-[#141414] rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-800 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.input.placeholder')}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">{t('chat.nick.as')} {myNick.current}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-400">{t('chat.encrypted')}</span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
