export const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  await navigator.serviceWorker.register(swUrl);
};
