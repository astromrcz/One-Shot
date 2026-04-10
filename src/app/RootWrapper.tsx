import { Outlet } from 'react-router';
import { AppProvider, useAppContext } from './context/AppContext';

function RootContent() {
  const { loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-amber-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading One Shot Bar & Billiards...</p>
          <p className="mt-2 text-sm text-gray-500">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function RootWrapper() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}