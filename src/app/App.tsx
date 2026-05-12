import { RouterProvider } from 'react-router';
import { router } from './routes';
import OneSignal from 'react-onesignal';
import { useEffect } from 'react';


let isOneSignalInit = false;

export default function App() {
  
  useEffect(() => {
    const initOneSignal = async () => {
      if (isOneSignalInit) return;
      isOneSignalInit = true;

      try {
        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true, 
        });
        
        // Ask the customer for permission to send notifications
        OneSignal.Slidedown.promptPush();
      } catch (error: any) {
        // 🚨 Catch and ignore the Hot Reload "already initialized" error!
        if (error.message === "SDK already initialized") {
          console.log("OneSignal already initialized (HMR ignored).");
        } else {
          console.error("OneSignal Init Error:", error);
        }
      }
    };

    initOneSignal();
  }, []);

  const handleCustomerBooking = async (customerName: string) => {
    if (OneSignal.Notifications.permission === true) {
       OneSignal.User.addTag("customer_name", customerName.toLowerCase());
    }
  };

  return <RouterProvider router={router} />;
}