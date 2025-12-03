const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('tiger_token');
  console.log('authFetch - Token:', token ? 'Present' : 'Missing');
  console.log('authFetch - URL:', url);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('authFetch - Adding Authorization header');
  }
  
  console.log('authFetch - Headers:', headers);
  
  return fetch(url, {
    ...options,
    headers
  });
};