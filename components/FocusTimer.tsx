
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from '../services/geminiService';
import { auth, db, collection, addDoc, handleFirestoreError, OperationType } from '../firebase';
import axios from 'axios';

interface SpotifyUser {
  display_name: string;
  images: { url: string }[];
}

interface SpotifyTrack {
  item: {
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  };
  is_playing: boolean;
}

const FocusTimer: React.FC = () => {
  const [duration, setDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [aiTip, setAiTip] = useState("Preparing your session...");
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);
  const [isDeepWork, setIsDeepWork] = useState(true);
  
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace issues in browser environment
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSpotifyData = async () => {
    try {
      const userRes = await axios.get('/api/spotify/me');
      setSpotifyUser(userRes.data);
      
      const playerRes = await axios.get('/api/spotify/player');
      if (playerRes.data && playerRes.data.item) {
        setCurrentTrack(playerRes.data);
      } else {
        setCurrentTrack(null);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("Spotify fetch error:", error);
      }
      setSpotifyUser(null);
    }
  };

  useEffect(() => {
    fetchSpotifyData();
    const interval = setInterval(fetchSpotifyData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        fetchSpotifyData();
        setIsConnectingSpotify(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectSpotify = async () => {
    setIsConnectingSpotify(true);
    try {
      const res = await axios.get('/api/auth/spotify/url');
      window.open(res.data.url, 'spotify_auth', 'width=600,height=700');
    } catch (error) {
      console.error("Failed to get Spotify auth URL:", error);
      setIsConnectingSpotify(false);
    }
  };

  const handleSpotifyLogout = async () => {
    await axios.post('/api/spotify/logout');
    setSpotifyUser(null);
    setCurrentTrack(null);
  };

  const saveWorkLog = async (durationMinutes: number) => {
    if (!auth.currentUser || !sessionStartTime) return;
    
    try {
      const now = new Date();
      const endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      await addDoc(collection(db, 'work_logs'), {
        date,
        startTime: sessionStartTime,
        endTime,
        duration: `${durationMinutes}m 00s`,
        status: durationMinutes >= 60 ? 'overworked' : 'completed',
        isDeepWork,
        authorUid: auth.currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'work_logs');
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      saveWorkLog(duration); // Log the actual session duration
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await gemini.getFocusRecommendation("General Knowledge Worker Focus");
      setAiTip(tip || "Eliminate distractions for deep work.");
    };
    fetchTip();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
  };

  const adjustDuration = (amount: number) => {
    if (isActive) return;
    const newDuration = Math.max(1, Math.min(120, duration + amount));
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
  };

  const handleSpotifyAction = async (action: string) => {
    try {
      if (action === 'play' || action === 'pause') {
        await axios.put(`/api/spotify/${action}`);
      } else {
        await axios.post(`/api/spotify/${action}`);
      }
      // Immediate fetch after action
      setTimeout(fetchSpotifyData, 500);
    } catch (error) {
      console.error(`Spotify ${action} failed:`, error);
    }
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 283;

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-background-dark overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse transition-colors duration-1000 ${isDeepWork ? 'bg-primary/30' : 'bg-primary/10'}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-1000 ${isDeepWork ? 'bg-blue-600/20' : 'bg-blue-900/10'}`}></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        <div className="relative flex items-center justify-center mb-12">
          <svg className="size-[280px] sm:size-[320px] md:size-[480px] -rotate-90 transform timer-glow" viewBox="0 0 100 100">
            <circle className="text-border-dark" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="2" />
            <circle 
              className="text-primary transition-all duration-300" 
              cx="50" cy="50" fill="none" r="45" stroke="currentColor" 
              strokeWidth="2" strokeDasharray="283" strokeDashoffset={283 - progress}
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-6xl sm:text-7xl md:text-9xl font-thin tracking-tighter tabular-nums text-text-main">
              {formatTime(timeLeft)}
            </span>
            <span className="mt-4 text-[10px] md:text-xs font-black tracking-widest uppercase text-primary/80">Growth Mode</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {!isActive && (
            <div className="flex items-center gap-2 bg-surface-dark rounded-full p-1 border border-border-dark">
              <button 
                onClick={() => adjustDuration(-5)}
                className="size-10 rounded-full flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="text-sm font-black text-text-main w-8 text-center">{duration}m</span>
              <button 
                onClick={() => adjustDuration(5)}
                className="size-10 rounded-full flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTimer}
              className="flex items-center gap-2 h-14 md:h-16 px-8 md:px-10 rounded-full bg-surface-dark text-text-main font-bold hover:bg-border-dark transition-all active:scale-95 shadow-xl shadow-black/10"
            >
              <span className="material-symbols-outlined">{isActive ? 'pause' : 'play_arrow'}</span>
              <span>{isActive ? 'Pause' : 'Start Focus'}</span>
            </button>
            <button 
              onClick={resetTimer}
              className="flex items-center justify-center size-14 md:size-16 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[400px] border-l border-border-dark bg-surface-dark/30 backdrop-blur-md p-10 flex flex-col gap-10 z-10">
        <div className="p-6 rounded-2xl bg-surface-dark border border-border-dark flex items-center justify-between">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-text-main font-black">
                 <span className={`material-symbols-outlined ${isDeepWork ? 'text-primary' : 'text-text-secondary'}`}>eco</span>
                 DEEP WORK MODE
              </div>
              <p className="text-xs text-text-secondary">{isDeepWork ? 'AI noise cancellation active' : 'Standard focus mode'}</p>
           </div>
           <button 
             onClick={() => setIsDeepWork(!isDeepWork)}
             className="relative inline-flex items-center cursor-pointer group"
           >
              <div className={`w-11 h-6 rounded-full transition-all duration-300 ${isDeepWork ? 'bg-primary' : 'bg-border-dark'}`}>
                <div className={`absolute top-[2px] left-[2px] bg-white size-5 rounded-full shadow-sm transition-transform duration-300 ${isDeepWork ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
           </button>
        </div>

        <div>
           <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Daily AI Tip</h3>
           <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-text-main italic">
              "{aiTip}"
           </div>
        </div>

        <div className="mt-auto p-4 rounded-3xl bg-surface-dark border border-border-dark flex flex-col gap-4">
           {spotifyUser ? (
             <>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div 
                      className={`size-12 rounded-full bg-cover bg-center ${currentTrack?.is_playing ? 'animate-[spin_10s_linear_infinite]' : ''}`} 
                      style={{backgroundImage: `url(${currentTrack?.item?.album?.images?.[0]?.url || 'https://picsum.photos/seed/ambient/200'})`}}
                    ></div>
                    <div className="flex flex-col max-w-[180px]">
                       <span className="text-sm font-black text-text-main truncate">
                         {currentTrack?.item?.name || 'No track playing'}
                       </span>
                       <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter truncate">
                         {currentTrack?.item?.artists?.map(a => a.name).join(', ') || 'Spotify'}
                       </span>
                    </div>
                 </div>
                 <button onClick={handleSpotifyLogout} className="text-text-secondary hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-sm">logout</span>
                 </button>
               </div>
               <div className="flex items-center justify-center gap-6 text-text-secondary">
                  <button onClick={() => handleSpotifyAction('previous')} className="material-symbols-outlined hover:text-text-main cursor-pointer">skip_previous</button>
                  <button 
                    onClick={() => handleSpotifyAction(currentTrack?.is_playing ? 'pause' : 'play')}
                    className="material-symbols-outlined hover:text-text-main cursor-pointer text-4xl"
                  >
                    {currentTrack?.is_playing ? 'pause_circle' : 'play_circle'}
                  </button>
                  <button onClick={() => handleSpotifyAction('next')} className="material-symbols-outlined hover:text-text-main cursor-pointer">skip_next</button>
               </div>
             </>
           ) : (
             <div className="flex flex-col gap-4 items-center py-2">
                <div className="flex items-center gap-3 w-full">
                  <div className="size-10 rounded-full bg-[#1DB954] flex items-center justify-center">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                      alt="Spotify" 
                      className="size-6" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-text-main">Spotify Music</span>
                    <span className="text-[10px] text-text-secondary">Connect your account</span>
                  </div>
                </div>
                <button 
                  onClick={handleConnectSpotify}
                  disabled={isConnectingSpotify}
                  className="w-full py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-black rounded-full transition-all flex items-center justify-center gap-2"
                >
                  {isConnectingSpotify ? 'CONNECTING...' : 'CONNECT SPOTIFY'}
                </button>
             </div>
           )}
        </div>
      </aside>
    </div>
  );
};

export default FocusTimer;
