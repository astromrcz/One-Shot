import { RouterProvider } from 'react-router';
import { router } from './routes';
import OneSignal from 'react-onesignal';
import { useEffect } from 'react';

// 🚨 NEW: Global flag OUTSIDE the component so React can't double-fire it
let isOneSignalInit = false; 

export default function App() {
  
  // 1. Start the Push Service when the website loads
  useEffect(() => {
    if (isOneSignalInit) return; // 🚨 Check the global flag
    isOneSignalInit = true;      // 🚨 Set the global flag immediately

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
    // 🚨 THE MAGIC: Tag this anonymous phone with their name!
    if (OneSignal.Notifications.permission === true) {
       OneSignal.User.addTag("customer_name", customerName.toLowerCase());
    }
  };

  return <RouterProvider router={router} />;
}