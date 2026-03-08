import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Briefcase, Target, Clock, Building2, FileText } from 'lucide-react';
import { InterviewMode, Difficulty } from '../types';

interface SetupWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    mode: InterviewMode.HR,
    difficulty: Difficulty.MEDIUM,
    duration: 30,
    company: '',
    role: '',
    website: ''
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const steps = [
    { title: 'Interview Type', icon: Briefcase },
    { title: 'Difficulty', icon: Target },
    { title: 'Company Details', icon: Building2 },
    { title: 'Duration', icon: Clock }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-12">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > i ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${step > i ? 'text-white' : 'text-white/40'}`}>{s.title}</span>
            {i < steps.length - 1 && <div className="w-8 h-[1px] bg-white/10 mx-2" />}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-medium">What type of interview?</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.values(InterviewMode).map(m => (
                  <button
                    key={m}
                    onClick={() => setConfig({ ...config, mode: m })}
                    className={`p-6 rounded-2xl border transition-all text-left ${config.mode === m ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="font-medium">{m}</div>
                    <div className="text-sm opacity-50">Focus on {m.toLowerCase()} skills</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-medium">Select Difficulty</h2>
              <div className="space-y-4">
                {Object.values(Difficulty).map(d => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                    className={`w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between ${config.difficulty === d ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div>
                      <div className="font-medium">{d}</div>
                      <div className="text-sm opacity-50">
                        {d === Difficulty.EASY && 'Supportive, guiding, hints allowed.'}
                        {d === Difficulty.MEDIUM && 'Professional, probing for metrics.'}
                        {d === Difficulty.HARD && 'Strict, skeptical, blunt-but-professional.'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-medium">Company Details</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Target Company (e.g. Google)"
                  value={config.company}
                  onChange={e => setConfig({ ...config, company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="text"
                  placeholder="Target Role (e.g. Senior Frontend Engineer)"
                  value={config.role}
                  onChange={e => setConfig({ ...config, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="url"
                  placeholder="Company Website (Required)"
                  value={config.website}
                  onChange={e => setConfig({ ...config, website: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-medium">Planned Duration</h2>
              <div className="grid grid-cols-3 gap-4">
                {[30, 60, 120].map(d => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, duration: d })}
                    className={`p-6 rounded-2xl border transition-all ${config.duration === d ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="text-2xl font-bold">{d}</div>
                    <div className="text-sm opacity-50">Minutes</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <button 
            onClick={step === 1 ? onCancel : prev}
            className="text-white/40 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ChevronLeft size={20} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button 
            onClick={step === 4 ? () => onComplete(config) : next}
            disabled={step === 3 && (!config.company || !config.role || !config.website)}
            className="bg-white text-black px-8 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
          >
            {step === 4 ? 'Launch Session' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
