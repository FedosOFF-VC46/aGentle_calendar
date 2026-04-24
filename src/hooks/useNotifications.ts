import { useEffect, useMemo, useState } from 'react';

interface GentleNotificationOptions {
  body?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export const useNotifications = () => {
  const isSupported = 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    isSupported ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (!isSupported) return;

    const syncPermission = () => setPermission(Notification.permission);

    syncPermission();
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);

    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, [isSupported]);

  const api = useMemo(
    () => ({
      requestPermission: async () => {
        if (!isSupported) return 'denied' as NotificationPermission;
        const nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
        return nextPermission;
      },
      notify: async (title: string, options: GentleNotificationOptions = {}) => {
        if (!isSupported || Notification.permission !== 'granted') return false;

        try {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
              body: options.body,
              tag: options.tag,
              requireInteraction: options.requireInteraction
            });
            return true;
          }

          new Notification(title, {
            body: options.body,
            tag: options.tag,
            requireInteraction: options.requireInteraction
          });
          return true;
        } catch {
          return false;
        }
      }
    }),
    [isSupported]
  );

  return { isSupported, permission, ...api };
};
