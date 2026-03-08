import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, AlertTriangle, Calendar, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { DebriefData } from '../types';

interface DebriefProps {
  data: DebriefData;
  onRegenerate: () => void;
  onClose: () => void;
}

export const Debrief: React.FC<DebriefProps> = ({ data, onRegenerate, onClose }) => {
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowScores(true), 500);
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-medium mb-2">Interview Debrief</h1>
          <p className="text-white/50">Comprehensive analysis of your performance.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onRegenerate}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={onClose}
            className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-emerald-500 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
          <div className="text-sm text-white/40 uppercase tracking-widest mb-4">Overall Score</div>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={showScores ? { scale: 1, opacity: 1 } : {}}
            className="text-7xl font-bold text-emerald-400 mb-2"
          >
            {data.scores.overall}
          </motion.div>
          <div className="text-sm text-white/60">Top 15% of candidates</div>
        </div>
        
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: 'Communication', value: data.scores.communication },
            { label: 'STAR Structure', value: data.scores.structure_star },
            { label: 'Role Fit', value: data.scores.role_fit },
            { label: 'Confidence', value: data.scores.confidence_clarity },
            { label: 'Delivery', value: data.scores.delivery },
            { label: 'Technical Depth', value: data.scores.technical_depth },
          ].map((score, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-white/40">{score.label}</span>
                <span className="text-lg font-medium">{score.value}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={showScores ? { width: `${score.value}%` } : {}}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-medium flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400" />
            Key Strengths
          </h3>
          {data.strengths.map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <h4 className="font-medium text-lg">{s.title}</h4>
              <p className="text-white/60 text-sm leading-relaxed">{s.why_it_matters}</p>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 italic text-sm text-white/40">
                "{s.evidence.quote}"
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-medium flex items-center gap-3">
            <AlertTriangle className="text-amber-400" />
            Areas for Growth
          </h3>
          {data.improvements.map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <h4 className="font-medium text-lg">{s.title}</h4>
              <p className="text-white/60 text-sm leading-relaxed">{s.issue}</p>
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                <div className="text-xs text-amber-500 uppercase font-bold mb-2">Try this instead</div>
                <p className="text-sm text-white/70">{s.better_answer_example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Plan */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
        <h3 className="text-2xl font-medium mb-8 flex items-center gap-3">
          <Calendar className="text-indigo-400" />
          7-Day Mastery Plan
        </h3>
        <div className="grid grid-cols-7 gap-4">
          {data.practice_plan_7_days.map((day, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
              <div className="text-xs text-white/30 mb-2">Day {day.day}</div>
              <div className="font-medium text-sm mb-1">{day.focus}</div>
              <div className="text-[10px] text-emerald-400">{day.time_minutes}m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
