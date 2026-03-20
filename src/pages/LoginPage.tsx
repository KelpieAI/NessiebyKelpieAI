import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sequence = ['w', 'w', 's', 's', 'a', 'd'];
    let index = 0;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === sequence[index]) {
        index++;

        if (index === sequence.length) {
          // Cheat code completed – toggle dev mode
          setShowDevMode(prev => {
            const next = !prev;

            // When activating dev mode, pre-fill credentials
            if (!prev) {
              setEmail('DEVELOPER');
              setPassword('cf56b3ef-2fb1-4068-a603-70ceb311959f');
            }

            return next;
          });

          index = 0; // reset after success
        }
      } else {
        // Wrong key – reset sequence
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

    if (error) {
      setError(error.message || 'Failed to sign in');
      setLoading(false);
      return;
    }

    if (data) {
      navigate('/queue');
    }
  };

  // DEV ONLY: Quick login bypass
  const handleDevLogin = async () => {
    setError('');
    setLoading(true);
    
    // Hardcoded dev credentials (only accessible via keyboard cheat code)
    const devEmail = 'sami.mustafa@kelpieai.co.uk';
    const devPassword = 'KilluminatI2211!'; // ← CHANGE THIS!
    
    const { data, error } = await signIn(devEmail, devPassword);
    
    if (error) {
      setError('Dev login failed: ' + error.message);
      setLoading(false);
      return;
    }
    
    if (data) {
      navigate('/queue');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0f14',
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '20px',
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo & Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
          }}>
            🐉
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '8px',
            fontFamily: "'Playfair Display', serif",
          }}>
            Welcome to Nessie
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#94a3b8',
          }}>
            Kelpie AI Outreach Console
          </p>
        </div>

        {/* Login Form */}
        <div style={{
          background: '#1a2634',
          border: '1px solid #2d3748',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: '8px',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@kelpieai.co.uk"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#14b8a6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: '8px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#14b8a6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                marginBottom: '20px',
              }}>
                <p style={{
                  fontSize: '13px',
                  color: '#ef4444',
                  margin: 0,
                }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#14b8a6',
                color: '#021014',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = '1';
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* SECRET DEV MODE: Only visible via W W S S A D */}
            {showDevMode && (
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }
                }}
                title="Secret dev login - type W W S S A D"
              >
                🔓 Dev Quick Login
              </button>
            )}
          </form>

          <div style={{
            marginTop: '20px',
            textAlign: 'center',
          }}>
            <a
              href="#"
              style={{
                fontSize: '13px',
                color: '#14b8a6',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Forgot password?
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
          }}>
            Powered by Kelpie AI · Version 0.9.1 · Dev Build - INTERNAL USE ONLY
          </p>
        </div>
      </div>
    </div>
  );
};
