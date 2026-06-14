import { useState } from 'react';
import { ArrowLeft, MessageSquareHeart, Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { submitFeedback } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export function Feedback() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [message, setMessage] = useState('');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError(t.feedback.emptyMessageError);
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitFeedback(
        {
          message: message.trim(),
          rating: rating || undefined,
          name: user ? undefined : (name.trim() || undefined),
          email: user ? undefined : (email.trim() || undefined),
        },
        user?.token,
      );
      setSent(true);
    } catch {
      setError(t.feedback.submitError);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 text-center gap-4 pb-28">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">{t.feedback.thankYou}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {t.feedback.successMessage}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm active:scale-95 transition-all"
        >
          {t.feedback.backToHome}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">

      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all">
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-base font-black text-gray-900 dark:text-white">{t.feedback.title}</span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 md:pt-10">

        {/* Desktop header */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <MessageSquareHeart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{t.feedback.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.feedback.subtitle}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">

          {/* Rating */}
          <div>
            <p className="text-sm font-black text-gray-800 dark:text-gray-200 mb-2">{t.feedback.rateSite}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  className="active:scale-90 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i <= (hover || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name / Email — only for guests */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">{t.feedback.nameOptional}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.feedback.namePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">{t.feedback.emailOptional}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">{t.feedback.yourFeedback}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={t.feedback.textareaPlaceholder}
              className="w-full px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all"
          >
            {sending ? t.feedback.sending : t.feedback.send}
          </button>
        </div>
      </div>
    </div>
  );
}
