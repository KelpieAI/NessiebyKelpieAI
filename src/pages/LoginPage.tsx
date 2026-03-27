import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Apply theme on the login page too
  useTheme();

  useEffect(() => {
    const sequence = ['w', 'w', 's', 's', 'a', 'd'];
    let index = 0;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === sequence[index]) {
        index++;
        if (index === sequence.length) {
          setShowDevMode(prev => {
            if (!prev) { setEmail('DEVELOPER'); setPassword('cf56b3ef-2fb1-4068-a603-70ceb311959f'); }
            return !prev;
          });
          index = 0;
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await signIn(email, password);
    if (error) { setError(error.message || 'Failed to sign in'); setLoading(false); return; }
    if (data) navigate('/queue');
  };

  const handleDevLogin = async () => {
    setError('');
    setLoading(true);
    const { data, error } = await signIn('sami.mustafa@kelpieai.co.uk', 'KilluminatI2211!');
    if (error) { setError('Dev login failed: ' + error.message); setLoading(false); return; }
    if (data) navigate('/queue');
  };

  return (
    <div className="login-page">
      {/* Background grid texture */}
      <div className="login-grid" />

      {/* Teal radial glow */}
      <div className="login-glow" />

      <div className="login-card-wrap">

        {/* Logo & header */}
        <div className="login-header">
          <div className="login-logo-box">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C7.37 2 2 7.37 2 14s5.37 12 12 12 12-5.37 12-12S20.63 2 14 2z" fill="rgba(10,191,163,0.12)" stroke="#0ABFA3" strokeWidth="1.2"/>
              <path d="M10 11.5c0-2.21 1.79-4 4-4h.5c2.21 0 4 1.79 4 4 0 1.36-.68 2.56-1.71 3.28L14 17.5l-2.79-2.72A3.99 3.99 0 0110 11.5z" fill="#0ABFA3" opacity="0.85"/>
              <circle cx="14" cy="21" r="1.5" fill="#0ABFA3" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="login-title">Welcome to Nessie</h1>
          <p className="login-subtitle">Kelpie AI Outreach Console</p>
        </div>

        {/* Form card */}
        <div className="login-card">
          <form onSubmit={handleSubmit}>

            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@kelpieai.co.uk"
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="login-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M7 1.5L13 12.5H1L7 1.5z" stroke="var(--danger)" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7 5.5v3" stroke="var(--danger)" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="7" cy="10.5" r="0.7" fill="var(--danger)"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="login-spinner" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>

            {/* Secret dev mode — WWSSAD */}
            {showDevMode && (
              <button
                type="button"
                className="login-dev-btn"
                onClick={handleDevLogin}
                disabled={loading}
                title="Secret dev login — type W W S S A D"
              >
                🔓 Dev Quick Login
              </button>
            )}
          </form>

          <div className="login-forgot">
            <a href="#" className="login-link">Forgot password?</a>
          </div>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Powered by Kelpie AI · v0.10.0 · Internal use only
        </p>
      </div>
    </div>
  );
};