import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const QuickNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [user]);

  // Auto-save on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== '') {
        saveNotes();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes]);

  const loadNotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_notes')
      .select('notes, updated_at')
      .eq('user_id', user.id)
      .maybesingle();

    if (data) {
      setNotes(data.notes || '');
      setLastSaved(data.updated_at ? new Date(data.updated_at) : null);
    }
  };

  const saveNotes = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: user.id,
          notes: notes,
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const getLastSavedText = () => {
    if (saving) return 'Saving...';
    if (!lastSaved) return '';
    
    const now = new Date();
    const seconds = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (seconds < 5) return 'Saved just now';
    if (seconds < 60) return 'Saved a few seconds ago';
    if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)}m ago`;
    return 'Saved';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
          Visible only inside Nessie
        </div>
      </div>

      {/* Notes Textarea */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add quick notes here: objections, call outcomes, manual tweaks you made, etc."
        style={{
          flex: 1,
          width: '100%',
          minHeight: '200px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: '6px',
          color: '#cbd5e1',
          fontSize: '13px',
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: '1.6',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
        }}
      />

      {/* Footer */}
      <div style={{ 
        marginTop: '12px', 
        fontSize: '11px', 
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{getLastSavedText()}</span>
      </div>
    </div>
  );
};