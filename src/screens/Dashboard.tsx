import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, History, TrendingUp, ChevronRight, Clock, Award } from 'lucide-react';
import { InterviewSession } from '../types';

interface DashboardProps {
  onStart: () => void;
  onViewSession: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStart, onViewSession }) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    fetch('/api/interviews')
      .then(res => res.json())
      .then(data => setSessions(data));
  }, []);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-medium mb-2">Dashboard</h1>
          <p className="text-white/50">Track your progress and start new sessions.</p>
        </div>
        <button 
          onClick={onStart}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Start Interview
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: History, color: 'text-blue-400' },
          { label: 'Avg. Score', value: sessions.length ? Math.round(sessions.reduce((acc, s) => acc + (s.debrief ? JSON.parse(s.debrief).scores.overall : 0), 0) / sessions.length) : '-', icon: Award, color: 'text-emerald-400' },
          { label: 'Practice Time', value: sessions.length ? `${sessions.reduce((acc, s) => acc + s.duration, 0)}m` : '-', icon: Clock, color: 'text-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={20} className={stat.color} />
              <TrendingUp size={16} className="text-white/20" />
            </div>
            <div className="text-2xl font-medium">{stat.value}</div>
            <div className="text-sm text-white/40">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-medium">Recent Sessions</h2>
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-white/30">
              No sessions yet. Start your first interview to see results here.
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onViewSession(session.id)}
                className="w-full group flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all text-left"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                    {session.debrief ? JSON.parse(session.debrief).scores.overall : '-'}
                  </div>
                  <div>
                    <div className="font-medium">{session.role || 'General Interview'}</div>
                    <div className="text-sm text-white/40 flex items-center gap-3">
                      <span>{session.company || 'Mock Company'}</span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span>{session.mode}</span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
