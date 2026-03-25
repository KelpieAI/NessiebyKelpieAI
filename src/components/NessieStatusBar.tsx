import { useAuth } from '../hooks/useAuth';

export const NessieStatusBar = () => {
  const { user } = useAuth();
  
  // Get first 8 characters of user ID for display
  const shortUserId = user?.id ? user.id.substring(0, 8) : null;
  
  return (
    <div className="fixed bottom-2 right-3 z-50 pointer-events-none">
      <p className="text-[11px] text-gray-400 font-[Space Grotesk] tracking-wide select-none">
        Nessie by Kelpie AI (beta) | v0.10.0.249 | 25 Mar 2026 23:35
        {shortUserId ? ` | User: ${shortUserId}` : ""}
      </p>
    </div>
  );
};