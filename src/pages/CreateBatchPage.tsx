import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../hooks/useBatches';
import { useAuth } from '../hooks/useAuth';
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

  const { createBatch, updateBatch } = useBatches({ enableRealtime: false });
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) { showToast('You must be logged in to create a batch'); navigate('/login'); return; }

    const urls = urlsInput.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) { showToast('Add at least one website'); return; }
    if (!messageTemplate.trim()) { showToast('Message template is required'); return; }

    setIsSubmitting(true);

    const { data: batch, error } = await createBatch({
      label: batchName.trim() || `Batch ${Date.now()}`,
      total_urls: urls.length,
      user_id: user.id,
      channel,
      subject_template: channel === 'email' && subjectTemplate.trim() ? subjectTemplate.trim() : undefined,
      message_template: messageTemplate.trim(),
    });

    if (error || !batch) {
      const msg = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Unknown error';
      showToast(`Error creating batch: ${msg}`);
      setIsSubmitting(false);
      return;
    }

    showToast(`Batch created! Nessie is processing ${urls.length} leads…`);

    const makeWebhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL;
    const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';

    if (makeWebhookUrl) {
      try {
        const normalizedUrls = urls.map(url => {
          const t = url.trim();
          return t.startsWith('https://') || t.startsWith('http://') ? t : `https://${t}`;
        });

        const res = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(webhookSecret && { 'X-Webhook-Secret': webhookSecret }) },
          body: JSON.stringify({
            batch_id: batch.id, batch_uuid: batch.id, user_id: user.id,
            webhook_secret: webhookSecret, urls: normalizedUrls,
            label: batchName.trim() || `Batch ${Date.now()}`, channel,
            subject_template: channel === 'email' && subjectTemplate.trim() ? subjectTemplate.trim() : undefined,
            message_template: messageTemplate.trim(),
          }),
        });

        if (res.ok) {
          await updateBatch(batch.id, { status: 'processing' });
        } else {
          showToast('Batch created but webhook failed. Check console.');
        }
      } catch {
        showToast('Batch created but webhook failed. Check console.');
      }
    } else {
      showToast('Batch created but webhook URL not configured');
    }

    navigate('/queue');
  };

  return (
    <div className="cbp-wrap">

      {/* Page header */}
      <div className="cbp-header">
        <button className="cbp-back" onClick={() => navigate('/queue')}>
          ← Back to Queue
        </button>
        <h1 className="cbp-title">Create a new batch</h1>
        <p className="cbp-sub">
          Name your batch and drop in websites. Nessie will enrich them in the background while you get on with your day.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="cbp-grid">

          {/* Left col — batch name + URLs */}
          <div className="cbp-col">
            <div className="cbp-field">
              <div className="label">Batch name</div>
              <input className="input" value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Restaurant Push · Edinburgh" />
            </div>
            <div className="cbp-field cbp-field--flex">
              <div className="label">Paste websites (one per line)</div>
              <textarea
                className="textarea"
                value={urlsInput}
                onChange={e => setUrlsInput(e.target.value)}
                placeholder={"https://example-restaurant.com\nhttps://example-cafe.co.uk\nhttps://example-venue.com"}
                style={{ flex: 1, minHeight: '400px', resize: 'vertical' }}
              />
              <div className="helper-text">Nessie will turn each URL into a lead. CSV upload coming later — for now, just paste.</div>
            </div>
          </div>

          {/* Right col — channel + templates */}
          <div className="cbp-col">

            {/* Channel toggle */}
            <div className="cbp-field">
              <div className="label" style={{ marginBottom: '8px' }}>Campaign Type</div>
              <div className="cbp-channel-row">
                {(['dm', 'email'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`cbp-channel-btn ${channel === c ? 'cbp-channel-btn--active' : ''}`}
                  >
                    {c === 'dm' ? 'DM' : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            {channel === 'email' && (
              <div className="cbp-field">
                <div className="label">Subject Template <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></div>
                <input className="input" value={subjectTemplate} onChange={e => setSubjectTemplate(e.target.value)} placeholder="Subject line with {{variables}}" maxLength={100} />
                <div className="helper-text">{subjectTemplate.length} characters · Recommend &lt;60 for best open rates</div>
              </div>
            )}

            <div className="cbp-field cbp-field--flex">
              <div className="label">
                Message Template <span style={{ color: 'var(--teal)' }}>*</span>
              </div>
              <textarea
                className="textarea"
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
                placeholder={channel === 'email'
                  ? 'Hi there,\n\n{{icebreaker}}\n\nWe help {{industry}} businesses improve their outreach. Fancy a chat?\n\nCheers,\n[Your name]'
                  : 'Hi! {{icebreaker}} - would love to connect and share some ideas. What do you think?'}
                style={{ flex: 1, minHeight: '300px', resize: 'vertical' }}
                required
              />
              <div className="helper-text">
                {messageTemplate.length} characters · Variables:{' '}
                {['{{company}}', '{{industry}}', '{{icebreaker}}', '{{website}}'].map(v => (
                  <span key={v} className="cbp-var">{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="button-row" style={{ marginTop: '8px' }}>
          <button type="submit" className="btn" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'Creating…' : 'Let Nessie Hunt'}
          </button>
          <button type="button" className="btn ghost" onClick={() => navigate('/queue')} disabled={isSubmitting}>Cancel</button>
        </div>
      </form>

      {toasts.map(t => <Toast key={t.id} message={t.message} onClose={() => removeToast(t.id)} />)}
    </div>
  );
};