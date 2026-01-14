import { useAuth } from '../hooks/useAuth';

export const NessieStatusBar = () => {
  const { user } = useAuth();
  
  // Get first 8 characters of user ID for display
  const shortUserId = user?.id ? user.id.substring(0, 8) : null;
  
  return (
    <div className="fixed bottom-2 right-3 z-50 pointer-events-none">
      <p className="text-[11px] text-gray-400 font-[Space Grotesk] tracking-wide select-none">
        Nessie by Kelpie AI (beta) | v0.9.1.228 | 14 Jan 2026 00:12
        {shortUserId ? ` | User: ${shortUserId}` : ""}
      </p>
    </div>
  );
};