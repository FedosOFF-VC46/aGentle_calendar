import { useMemo } from 'react';

export const useNotifications = () => {
  const isSupported = 'Notification' in window;

  const api = useMemo(
    () => ({
      requestPermission: async () => {
        if (!isSupported) return 'denied' as NotificationPermission;
        return Notification.requestPermission();
      },
      notify: (title: string, body: string) => {
        if (!isSupported || Notification.permission !== 'granted') return;
        new Notification(title, { body });
      }
    }),
    [isSupported]
  );

  return { isSupported, ...api };
};
