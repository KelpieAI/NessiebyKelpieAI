import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Mail, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export const EmailTemplatesManager = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaults = async () => {
    const defaultTemplates = [
      {
        name: 'Cold Outreach - Value Proposition',
        description: 'Initial outreach focusing on value and pain points',
        category: 'cold-outreach',
        subject: 'Quick question about {{company}}\'s {{industry}} strategy',
        body: `Hi {{name}},

I noticed {{company}} is doing some impressive work in {{industry}}. I wanted to reach out because we've helped similar companies like yours streamline their outreach and save 15+ hours per week on lead generation.

Would you be open to a quick 15-minute call to explore how we could help {{company}} scale your outreach efforts?

Best regards,
{{sender_name}}`,
        variables: ['company', 'name', 'industry', 'sender_name'],
        is_default: true,
      },
      {
        name: 'Follow-Up - No Response',
        description: 'Polite follow-up after no initial response',
        category: 'follow-up',
        subject: 'Following up: {{company}} + automation',
        body: `Hi {{name}},

I wanted to follow up on my previous email about helping {{company}} with automated outreach.

I know you're busy, so I'll keep this brief: we've helped companies in {{industry}} increase their qualified leads by 3x while reducing manual work by 80%.

Worth a quick chat?

Best,
{{sender_name}}`,
        variables: ['company', 'name', 'industry', 'sender_name'],
        is_default: true,
      },
      {
        name: 'Break-Up Email',
        description: 'Final follow-up before giving up',
        category: 'follow-up',
        subject: 'Should I close your file?',
        body: `Hi {{name}},

I've reached out a few times about helping {{company}} with automated outreach, but haven't heard back.

I'll take that as a sign you're not interested right now, which is totally fine! I'll go ahead and close your file.

If things change and you'd like to revisit this in the future, just reply to this email and I'll be happy to help.

Best of luck with everything at {{company}}!

{{sender_name}}`,
        variables: ['company', 'name', 'sender_name'],
        is_default: true,
      },
    ];

    try {
      for (const template of defaultTemplates) {
        await supabase.from('email_templates').insert({
          ...template,
          user_id: user!.id,
        });
      }
      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase.from('email_templates').insert({
        user_id: user!.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        is_default: false,
      });

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Space Grotesk, sans-serif',
        color: 'var(--text-secondary)',
      }}>
        Loading templates...
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px 32px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '4px',
          }}>
            Email Templates
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            Create and manage reusable email templates
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {templates.length === 0 && (
            <button
              onClick={handleCreateDefaults}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Load Default Templates
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#021014',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          <Mail size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            No templates yet
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
          }}>
            Create your first template or load our default templates to get started
          </p>
          <button
            onClick={handleCreateDefaults}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#021014',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Load Default Templates
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px',
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px',
                transition: 'all 0.2s',
              }}
            >
              {/* Template Header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px',
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {template.name}
                  </h3>
                  {template.is_default && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 6px',
                      borderRadius: '3px',
                      background: 'rgba(17, 194, 210, 0.15)',
                      color: 'var(--accent)',
                      letterSpacing: '0.3px',
                    }}>
                      DEFAULT
                    </span>
                  )}
                </div>
                {template.description && (
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}>
                    {template.description}
                  </p>
                )}
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}>
                  Subject: {template.subject}
                </p>
              </div>

              {/* Template Preview */}
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '12px',
                maxHeight: '120px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {template.body.substring(0, 200)}
                  {template.body.length > 200 && '...'}
                </p>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '30px',
                  background: 'linear-gradient(to bottom, transparent, var(--surface))',
                }} />
              </div>

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}>
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        style={{
                          fontSize: '10px',
                          padding: '3px 6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '3px',
                          color: 'var(--accent)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
              }}>
                Used {template.times_used} times
                {template.last_used_at && ` • Last used ${new Date(template.last_used_at).toLocaleDateString()}`}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreviewModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Eye size={12} />
                  Preview
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'rgb(239, 68, 68)',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div
          style={{
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
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
            }}>
              {selectedTemplate.name}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '8px',
              }}>
                Subject:
              </label>
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--text)',
              }}>
                {selectedTemplate.subject}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '8px',
              }}>
                Body:
              </label>
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
              }}>
                {selectedTemplate.body}
              </div>
            </div>

            <button
              onClick={() => setShowPreviewModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};