import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nessie/TopBar';
import { useBatches } from '../hooks/useBatches';
import { useAuth } from '../hooks/useAuth'; // ADDED
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/nessie/Toast';
import '../styles/nessie.css';

export const CreateBatchPage = () => {
  const [batchName, setBatchName] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [channel, setChannel] = useState<'email' | 'dm'>('dm');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createBatch, updateBatch } = useBatches();
  const { user } = useAuth(); // ADDED: Get current user
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ADDED: Check if user is logged in
    if (!user) {
      showToast('You must be logged in to create a batch');
      navigate('/login');
      return;
    }

    const urls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      showToast('Add at least one website');
      return;
    }

    if (!messageTemplate.trim()) {
      showToast('Message template is required');
      return;
    }

    setIsSubmitting(true);

    const { data: batch, error } = await createBatch({
      label: batchName.trim() || `Batch ${Date.now()}`,
      total_urls: urls.length,
      user_id: user.id, // ADDED: Pass user ID
      channel,
      subject_template: channel === 'email' && subjectTemplate.trim() ? subjectTemplate.trim() : undefined,
      message_template: messageTemplate.trim(),
    });

    if (error || !batch) {
      console.error('Failed to create batch. Error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Unknown error';
      showToast(`Error creating batch: ${errorMessage}`);
      setIsSubmitting(false);
      return;
    }

    console.log('Batch created successfully:', batch);
    showToast(`Batch created! Nessie is processing ${urls.length} leads...`);

    const makeWebhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL;
    const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT'; // ADDED: Secret token with Bolt fallback

    if (makeWebhookUrl) {
      try {
        const normalizedUrls = urls.map(url => {
          const trimmedUrl = url.trim();
          if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://')) {
            return trimmedUrl;
          }
          return `https://${trimmedUrl}`;
        });

        const webhookResponse = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(webhookSecret && { 'X-Webhook-Secret': webhookSecret }), // ADDED: Send secret
          },
          body: JSON.stringify({
            batch_id: batch.id,
            batch_uuid: batch.id,
            user_id: user.id, // ADDED: Send user ID to Make
            webhook_secret: webhookSecret, // FIXED: Use variable instead of env directly
            urls: normalizedUrls,
            label: batchName.trim() || `Batch ${Date.now()}`,
            channel,
            subject_template: channel === 'email' && subjectTemplate.trim() ? subjectTemplate.trim() : undefined,
            message_template: messageTemplate.trim(),
          }),
        });

        if (webhookResponse.ok) {
          await updateBatch(batch.id, { status: 'processing' });
          console.log('Webhook sent successfully, batch status updated to processing');
        } else {
          const errorText = await webhookResponse.text();
          console.error('Webhook failed:', errorText);
          showToast('Batch created but webhook failed. Check console.');
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
        showToast('Batch created but webhook failed. Check console.');
      }
    } else {
      console.warn('VITE_MAKE_BATCH_WEBHOOK_URL not configured');
      showToast('Batch created but webhook URL not configured');
    }

    navigate('/queue');
  };

  const handleCancel = () => {
    navigate('/queue');
  };

  return (
    <div className="nessie-container">
      <TopBar
        activeView="Queue"
        onViewChange={(view) => {
          if (view === 'Queue') navigate('/queue');
          if (view === 'Analytics') navigate('/analytics');
          if (view === 'Settings') navigate('/settings');
        }}
        onCreateNewBatch={() => {
          navigate('/queue/new');
        }}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <a
            href="/queue"
            onClick={(e) => {
              e.preventDefault();
              navigate('/queue');
            }}
            style={{
              color: '#11c2d2',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to Queue
          </a>
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '8px',
        }}>
          Create a new batch
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginBottom: '32px',
        }}>
          Name your batch and drop in websites. Nessie will enrich them in the background while you get on with your day.
        </p>

        <form onSubmit={handleSubmit}>
          {/* FORM CONTENT - keeping your existing form JSX */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            gap: '32px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div className="label">Batch name</div>
                <input
                  className="input"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Restaurant Push · Edinburgh"
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="label">Paste websites (one per line)</div>
                <textarea
                  className="textarea"
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  placeholder="https://example-restaurant.com&#10;https://example-cafe.co.uk&#10;https://example-venue.com"
                  style={{ flex: 1, minHeight: '400px', resize: 'vertical' }}
                />
                <div className="helper-text" style={{ marginTop: '8px' }}>
                  Nessie will turn each URL into a lead. CSV upload coming later – for now, just paste.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div className="label" style={{ margin: 0, fontSize: '12px' }}>Campaign Type</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setChannel('dm')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: channel === 'dm' ? '2px solid #11c2d2' : '1px solid var(--border)',
                        background: channel === 'dm' ? 'rgba(17, 194, 210, 0.15)' : '#0d151a',
                        color: channel === 'dm' ? '#11c2d2' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      DM
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: channel === 'email' ? '2px solid #11c2d2' : '1px solid var(--border)',
                        background: channel === 'email' ? 'rgba(17, 194, 210, 0.15)' : '#0d151a',
                        color: channel === 'email' ? '#11c2d2' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Email
                    </button>
                  </div>
                </div>
              </div>

              {channel === 'email' && (
                <div>
                  <div className="label">Subject Template (optional)</div>
                  <input
                    className="input"
                    value={subjectTemplate}
                    onChange={(e) => setSubjectTemplate(e.target.value)}
                    placeholder="Subject line with {{variables}}"
                    maxLength={100}
                  />
                  <div className="helper-text" style={{ marginTop: '8px' }}>
                    {subjectTemplate.length} characters · Recommend &lt;60 for best open rates
                  </div>
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="label">
                  Message Template <span style={{ color: '#11c2d2' }}>*</span>
                </div>
                <textarea
                  className="textarea"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={
                    channel === 'email'
                      ? 'Hi there,\n\n{{icebreaker}}\n\nWe help {{industry}} businesses improve their outreach. Fancy a chat?\n\nCheers,\n[Your name]'
                      : 'Hi! {{icebreaker}} - would love to connect and share some ideas. What do you think?'
                  }
                  style={{ flex: 1, minHeight: '300px', resize: 'vertical' }}
                  required
                />
                <div className="helper-text" style={{ marginTop: '8px' }}>
                  {messageTemplate.length} characters · Available: <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{company}}'}</span>{' '}
                  <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{industry}}'}</span>{' '}
                  <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{icebreaker}}'}</span>{' '}
                  <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{website}}'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn"
              disabled={isSubmitting}
              style={{
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Creating...' : 'Let Nessie Hunt'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};