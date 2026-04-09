import { useAuth } from '../hooks/useAuth';

export const NessieStatusBar = () => {
  const { user } = useAuth();
  const shortUserId = user?.id ? user.id.substring(0, 8) : null;

  return (
    <div className="status-bar">
      Nessie by Kelpie AI (beta) | v0.11.0.301 | 09 Mar 2026 23:54
      {shortUserId ? ` | User: ${shortUserId}` : ''}
    </div>
  );
};