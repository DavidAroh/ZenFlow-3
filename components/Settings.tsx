
import React, { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import axios from 'axios';

interface SettingsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, onToggleTheme }) => {
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setDisplayName(userSnap.data().displayName || '');
      }
    };

    const fetchSpotifyStatus = async () => {
      try {
        const res = await axios.get('/api/spotify/me');
        setSpotifyUser(res.data);
      } catch (error) {
        setSpotifyUser(null);
      }
    };

    fetchUserData();
    fetchSpotifyStatus();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { displayName });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      await axios.post('/api/spotify/logout');
      setSpotifyUser(null);
      setMessage({ type: 'success', text: 'Disconnected from Spotify.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect from Spotify.' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-text-main mb-2 tracking-tight">Settings</h1>
        <p className="text-text-secondary">Manage your profile and external integrations.</p>
      </header>

      {message && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">person</span>
            <h2 className="text-xl font-black text-text-main uppercase tracking-widest text-sm">Profile Settings</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-2">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-text-main focus:border-primary focus:ring-0 transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={auth.currentUser?.email || ''} 
                disabled 
                className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-4 py-3 text-text-secondary cursor-not-allowed"
              />
              <p className="mt-2 text-[10px] text-text-secondary italic">Email cannot be changed as it is linked to your Google account.</p>
            </div>

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-primary text-background-dark font-black rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border-dark">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h2 className="text-xl font-black text-text-main uppercase tracking-widest text-sm">Appearance</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-dark rounded-2xl border border-border-dark">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="text-sm font-bold text-text-main">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button 
                onClick={onToggleTheme}
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none bg-border-dark"
              >
                <span 
                  className={`${
                    theme === 'dark' ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-text-secondary'
                  } inline-block w-4 h-4 transform rounded-full transition-transform`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">hub</span>
            <h2 className="text-xl font-black text-text-main uppercase tracking-widest text-sm">Integrations</h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-background-dark border border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[#1DB954] flex items-center justify-center">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                      alt="Spotify" 
                      className="size-5" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main">Spotify</h3>
                    <p className="text-[10px] text-text-secondary uppercase tracking-tighter">Music & Focus Audio</p>
                  </div>
                </div>
                {spotifyUser && (
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded uppercase">Connected</span>
                )}
              </div>

              {spotifyUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-xl border border-border-dark">
                    <div className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${spotifyUser.images?.[0]?.url || 'https://picsum.photos/seed/spotify/100'})` }}></div>
                    <span className="text-xs font-bold text-text-main">{spotifyUser.display_name}</span>
                  </div>
                  <button 
                    onClick={handleSpotifyLogout}
                    className="w-full py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-black rounded-xl transition-all"
                  >
                    DISCONNECT SPOTIFY
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-secondary mb-4 italic">Connect your Spotify account to listen to your favorite music during focus sessions.</p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-background-dark/30 border border-border-dark/50 opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-text-secondary">calendar_month</span>
                <h3 className="text-sm font-black text-text-secondary">Google Calendar</h3>
              </div>
              <p className="text-[10px] text-text-secondary uppercase tracking-tighter">Coming Soon</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
