import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { AuthScreen } from './screens/AuthScreen';
import { Dashboard } from './screens/Dashboard';
import { SetupWizard } from './screens/SetupWizard';
import { InterviewRoom } from './screens/InterviewRoom';
import { Debrief } from './screens/Debrief';
import { TranscriptTurn, DebriefData, InterviewMode, Difficulty } from './types';
import { generateDebrief } from './services/geminiDebrief';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'setup' | 'room' | 'debrief'>('dashboard');
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptTurn[]>([]);
  const [currentDebrief, setCurrentDebrief] = useState<DebriefData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Layout>
        <AuthScreen />
      </Layout>
    );
  }

  const handleStartSetup = () => setView('setup');
  
  const handleLaunchInterview = async (config: any) => {
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const { id } = await res.json();
      setCurrentConfig({ ...config, id });
      setView('room');
    } catch (err) {
      console.error("Failed to start session", err);
    }
  };

  const handleEndInterview = async (transcript: TranscriptTurn[]) => {
    setCurrentTranscript(transcript);
    setIsGenerating(true);
    setView('debrief');
    
    try {
      const debrief = await generateDebrief(
        transcript,
        currentConfig.duration,
        Math.round((Date.now() - new Date(currentConfig.created_at || Date.now()).getTime()) / 60000),
        currentConfig.company,
        currentConfig.role,
        currentConfig.mode,
        currentConfig.difficulty
      );
      
      setCurrentDebrief(debrief);
      
      // Save to server
      await fetch(`/api/interviews/${currentConfig.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: JSON.stringify(transcript),
          debrief: JSON.stringify(debrief),
          status: 'completed'
        })
      });
    } catch (err) {
      console.error("Failed to generate debrief", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewSession = async (id: string) => {
    const res = await fetch(`/api/interviews/${id}`);
    const session = await res.json();
    setCurrentConfig(session);
    setCurrentTranscript(JSON.parse(session.transcript || '[]'));
    setCurrentDebrief(JSON.parse(session.debrief || 'null'));
    setView('debrief');
  };

  return (
    <Layout>
      {view === 'dashboard' && (
        <Dashboard 
          onStart={handleStartSetup} 
          onViewSession={handleViewSession}
        />
      )}
      
      {view === 'setup' && (
        <SetupWizard 
          onComplete={handleLaunchInterview} 
          onCancel={() => setView('dashboard')} 
        />
      )}
      
      {view === 'room' && (
        <InterviewRoom 
          config={currentConfig} 
          onEnd={handleEndInterview} 
        />
      )}
      
      {view === 'debrief' && (
        <>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h2 className="text-2xl font-medium mb-2">Analyzing Performance...</h2>
                <p className="text-white/40">Our AI is reviewing your transcript and generating insights.</p>
              </div>
            </div>
          ) : currentDebrief ? (
            <Debrief 
              data={currentDebrief} 
              onRegenerate={() => handleEndInterview(currentTranscript)}
              onClose={() => setView('dashboard')}
            />
          ) : (
            <div className="text-center py-40">
              <p className="text-red-400">Failed to load debrief. Please try again.</p>
              <button onClick={() => setView('dashboard')} className="mt-4 text-emerald-500">Back to Dashboard</button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
