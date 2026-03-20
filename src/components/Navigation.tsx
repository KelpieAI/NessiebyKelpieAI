import { Send, AlertCircle, Code, Database, CheckCircle, Waves } from 'lucide-react';

export const Navigation = () => {
  const currentPath = window.location.hash.slice(1) || '/';

  const navItems = [
    { path: '/', label: 'Outreach', icon: Send },
    { path: '/leads', label: 'Successful Leads', icon: CheckCircle },
    { path: '/nessie', label: 'Failed Websites', icon: AlertCircle },
    { path: '/queue', label: 'Nessie Queue', icon: Waves },
    { path: '/docs', label: 'API Docs', icon: Code },
    { path: '/dev/seed', label: 'Dev Seed', icon: Database },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <a href="#/" className="text-xl font-bold text-gray-100">
              Kelpie
            </a>
            <div className="flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <a
                    key={item.path}
                    href={`#${item.path}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
