export const getSelfieUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const hostname = window.location.hostname;
  const backendHost = (hostname === 'localhost' || hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : `http://${hostname}:5000`;

  return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
};
