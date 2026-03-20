import { useState, useEffect } from 'react';
import { X, Send, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface EmailComposerProps {
  lead: {
    id: string;
    company_name: string;
    full_name: string;
    email: string;
    industry?: string;
  };
  onClose: () => void;
  onSent: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EmailComposer = ({ lead, onClose, onSent }: EmailComposerProps) => {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('id, name, subject, body')
      .eq('user_id', user!.id)
      .eq('is_active', true);
    
    if (data) setTemplates(data);
  };

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{company\}\}/g, lead.company_name || '')
      .replace(/\{\{name\}\}/g, lead.full_name || '')
      .replace(/\{\{industry\}\}/g, lead.industry || '')
      .replace(/\{\{sender_name\}\}/g, profile?.full_name || '');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSubject(replaceVariables(template.subject));
      setBody(replaceVariables(template.body));
    }
  };

  const handleSend = async () => {
    const finalEmail = lead.email || manualEmail;

    if (!finalEmail) {
      alert('Email address is required');
      return;
    }

    if (!subject || !body) {
      alert('Subject and body are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      // Call send-email Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to_email: finalEmail,
          to_name: lead.full_name,
          subject,
          body,
          lead_id: lead.id,
          template_id: selectedTemplateId || null,
        }
      });

      if (error) throw error;

      alert('Email sent successfully!');
      onSent();
      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      alert('Failed to send email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const finalEmail = lead.email || manualEmail;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      fontFamily: 'Space Grotesk, sans-serif',
    }}
    onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
              Send Email
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              To: {lead.full_name} ({finalEmail || 'No email'})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Email Input (if no email exists) */}
        {!lead.email && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '6px',
              marginBottom: '12px',
            }}>
              <AlertCircle size={16} color="#fbbf24" />
              <span style={{ fontSize: '13px', color: '#fbbf24' }}>
                No email found for this lead. Please enter one manually.
              </span>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="example@company.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
              }}
            />
          </div>
        )}

        {/* Template Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Template (optional)
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              cursor: 'pointer',
            }}>
            <option value="">-- Select a template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Body *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body"
            rows={12}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              resize: 'vertical',
              fontFamily: 'Space Grotesk, sans-serif',
              lineHeight: '1.6',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject || !body || !finalEmail}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: sending || !finalEmail ? 'var(--text-secondary)' : '#021014',
              background: sending || !finalEmail ? 'rgba(17, 194, 210, 0.5)' : 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              cursor: sending || !finalEmail ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
            <Send size={14} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};