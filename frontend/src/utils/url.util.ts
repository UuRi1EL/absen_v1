export const getSelfieUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return url;
  }

  return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};
