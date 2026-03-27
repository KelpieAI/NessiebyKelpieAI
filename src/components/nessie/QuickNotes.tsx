import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const QuickNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNotes(); }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => { if (notes !== '') saveNotes(); }, 1000);
    return () => clearTimeout(timer);
  }, [notes]);

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_notes')
      .select('notes, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
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
        .upsert({ user_id: user.id, notes, updated_at: new Date().toISOString() });
      if (!error) setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const getLastSavedText = () => {
    if (saving) return 'Saving…';
    if (!lastSaved) return '';
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 5) return 'Saved just now';
    if (seconds < 60) return 'Saved a few seconds ago';
    if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)}m ago`;
    return 'Saved';
  };

  return (
    <div className="qn-wrap">
      <div className="qn-hint">Visible only inside Nessie</div>
      <textarea
        className="qn-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add quick notes here — objections, call outcomes, manual tweaks you made, etc."
      />
      <div className="qn-footer">
        <span>{getLastSavedText()}</span>
      </div>
    </div>
  );
};