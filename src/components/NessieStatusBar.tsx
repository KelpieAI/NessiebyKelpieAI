import { useAuth } from '../hooks/useAuth';

export const NessieStatusBar = () => {
  const { user } = useAuth();
  const shortUserId = user?.id ? user.id.substring(0, 8) : null;

  return (
    <div className="status-bar">
      Nessie by Kelpie AI (beta) | v0.11.1.317 | 11 Apr 2026 01:30
      {shortUserId ? ` | User: ${shortUserId}` : ''}
    </div>
  );
};