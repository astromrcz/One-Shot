import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export function NotificationEngine() {
  const { 
    tables, 
    adminLoggedIn, 
    staffLoggedIn, 
    sendCustomerPush, 
    sendAdminPush 
  } = useAppContext();

  // We use a Set to remember what alerts we already fired so we don't spam phones!
  const notified = useRef(new Set<string>());

  useEffect(() => {
    // We only want the Admin/Staff portal to run this clock-watching loop
    if (!adminLoggedIn && !staffLoggedIn) return;

    const checkAlerts = () => {
      const now = new Date().getTime();

      tables.forEach(table => {
        if (table.status === 'occupied' && table.session) {
          const startTime = new Date(table.session.startTime).getTime();
          const endTime = startTime + (table.session.durationMinutes * 60000);
          const timeLeftMins = (endTime - now) / 60000;
          const customer = table.session.customerName;

          // 🚨 1. CUSTOMER WARNING: 30 Minutes Left
          if (timeLeftMins <= 30 && timeLeftMins > 0) {
            const alertId = `${table.id}-${startTime}-30m`;
            if (!notified.current.has(alertId)) {
              notified.current.add(alertId);
              sendCustomerPush(
                customer, 
                "30 Minutes Left 🎱", 
                `Hi ${customer}, you have 30 minutes left on ${table.name}. Head to the counter if you'd like to extend!`
              );
            }
          }
          
          // 🚨 2. CUSTOMER & ADMIN WARNING: Time is Up
          else if (timeLeftMins <= 0 && timeLeftMins > -5) {
            const alertId = `${table.id}-${startTime}-ended`;
            if (!notified.current.has(alertId)) {
              notified.current.add(alertId);
              
              // Tell the Customer
              sendCustomerPush(
                customer, 
                "Time's Up! ⏰", 
                `Your session on ${table.name} has ended. Hope you had a great game!`
              );
              
              // Tell the Admin
              sendAdminPush(
                "Table Ended 🛑", 
                `${table.name} (${customer}) has finished their session.`
              );
            }
          }

          // 🚨 3. ADMIN WARNING: Overtime (5+ minutes over)
          else if (timeLeftMins <= -5 && timeLeftMins > -60) {
            const alertId = `${table.id}-${startTime}-overtime`;
            if (!notified.current.has(alertId)) {
              notified.current.add(alertId);
              
              // Only alert the admin that the table hasn't been cleared yet
              sendAdminPush(
                "Table Overtime! 🚨", 
                `${table.name} is 5 minutes over their allotted time. Please check on them.`
              );
            }
          }
        }
      });
    };

    // Run the clock watcher every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [tables, adminLoggedIn, staffLoggedIn, sendCustomerPush, sendAdminPush]);

  // This component runs completely silently in the background
  return null;
}