import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LiveMonitor } from './pages/LiveMonitor';
import OneSignal from 'react-onesignal';
import { useEffect } from 'react';
export default function App() {
  
  // 1. Start the Push Service when the website loads
  useEffect(() => {
    if (OneSignal.initialized) return; // 🚨 Prevent double-initialization!

    OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // Needed for local testing
    }).then(() => {
      // Ask the customer for permission to send notifications
      OneSignal.Slidedown.promptPush();
    });
  }, []);

  // 2. Add this to your "Submit Reservation" or "Join Queue" button!
  const handleCustomerBooking = async (customerName: string) => {
    // ... your normal Supabase saving code ...

    // 🚨 THE MAGIC: Tag this anonymous phone with their name!
    if (OneSignal.Notifications.permission === true) {
       OneSignal.User.addTag("customer_name", customerName.toLowerCase());
    }
  };

  return <RouterProvider router={router} />;
}