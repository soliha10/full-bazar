import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, CheckCircle2, XCircle, Activity, Sparkles, ArrowRightLeft } from 'lucide-react';
import axios from 'axios';

interface Sample {
  a: string;
  b: string;
  expected: boolean;
  score?: number;
  is_match?: boolean;
}

export const AiMatcher: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [customResult, setCustomResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const API_BASE = '/api';

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ml/samples`);
      const initialSamples = res.data;
      
      // Run matching for each sample
      const enriched = await Promise.all(initialSamples.map(async (s: any) => {
        const matchRes = await axios.get(`${API_BASE}/ml/match`, {
          params: { name_a: s.a, name_b: s.b }
        });
        return { ...s, ...matchRes.data };
      }));
      
      setSamples(enriched);
    } catch (err) {
      console.error("Failed to fetch ML samples", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!customA || !customB) return;
    setTesting(true);
    try {
      const res = await axios.get(`${API_BASE}/ml/match`, {
        params: { name_a: customA, name_b: customB }
      });
      setCustomResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
        >
          <Brain size={20} />
          <span className="text-sm font-semibold tracking-wider uppercase">AI Matching Engine</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Smart Product Grouping
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Our AI logic detects identical products across different marketplaces, even if names and descriptions vary.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Real-time Tester */}
        <section>
          <div className="bg-card border rounded-3xl p-8 shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-bold">Try the Logic</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Product Name A (e.g. Asaxiy)</label>
                <input 
                  type="text"
                  value={customA}
                  onChange={(e) => setCustomA(e.target.value)}
                  placeholder="Apple iPhone 15 Pro Max 256GB"
                  className="w-full bg-background border rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/20 transition-all"
                />
              </div>

              <div className="flex justify-center py-2">
                <div className="p-2 rounded-full bg-muted">
                  <ArrowRightLeft size={20} className="text-muted-foreground rotate-90 lg:rotate-0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Product Name B (e.g. Olcha)</label>
                <input 
                  type="text"
                  value={customB}
                  onChange={(e) => setCustomB(e.target.value)}
                  placeholder="iPhone 15 Pro Max Natural Titanium"
                  className="w-full bg-background border rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/20 transition-all"
                />
              </div>

              <button 
                onClick={handleTest}
                disabled={testing || !customA || !customB}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? <Activity className="animate-spin" /> : <Search size={20} />}
                Analyze Similarity
              </button>

              <AnimatePresence>
                {customResult && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`mt-8 p-6 rounded-2xl border-2 ${customResult.is_match ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {customResult.is_match ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                        <span className={`font-bold text-lg ${customResult.is_match ? 'text-green-600' : 'text-red-600'}`}>
                          {customResult.recommendation}
                        </span>
                      </div>
                      <div className="text-sm font-mono bg-background px-3 py-1 rounded-lg border">
                        Score: {customResult.score}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${customResult.score * 100}%` }}
                        className={`h-full rounded-full ${customResult.is_match ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Synthetic Samples Benchmarks */}
        <section>
          <div className="bg-card border rounded-3xl p-8 shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Brain size={24} />
              </div>
              <h2 className="text-2xl font-bold">Matching Benchmarks</h2>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
                ))
              ) : (
                samples.map((s, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 border rounded-2xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4 text-sm">
                      <div className="font-medium">{s.a}</div>
                      <div className="flex flex-col items-center">
                         <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase mb-1 ${s.is_match ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {s.score}
                         </div>
                         <ArrowRightLeft size={14} className="text-muted-foreground" />
                      </div>
                      <div className="font-medium text-muted-foreground">{s.b}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t flex items-center gap-2 text-sm text-muted-foreground">
               <Activity size={16} />
               <span>Model: MLflow Integrated Logic (TF-IDF Similarity)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
