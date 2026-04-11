import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

// Google "G" logo as inline SVG — no external dependency needed
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useTheme();

  // Secret dev mode — type W W S S A D on keyboard
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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    // If successful, Supabase redirects the page — no need to navigate manually.
    // If it fails, we show the error and re-enable the button.
    if (error) {
      setError(error.message || 'Google sign in failed');
      setGoogleLoading(false);
    }
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
      <div className="login-grid" />
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

          {/* ── Google sign-in button ── */}
          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <div className="login-spinner" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Redirecting to Google…' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <span className="login-divider-line" />
          </div>

          {/* ── Email / password form (existing) ── */}
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

            <button type="submit" className="login-btn" disabled={loading || googleLoading}>
              {loading ? (
                <>
                  <div className="login-spinner" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>

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

        <p className="login-footer">
          Powered by Kelpie AI · v0.11.1 · Internal use only
        </p>
      </div>
    </div>
  );
};