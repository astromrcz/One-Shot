import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LiveMonitor } from './pages/LiveMonitor';

export default function App() {
  return <RouterProvider router={router} />;
}