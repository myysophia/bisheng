import axios from 'axios';

export function setAcceptLanguageHeader(value: string): void {
  axios.defaults.headers.common['Accept-Language'] = value;
}

export function setTokenHeader(token: string) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token header set:', token.substring(0, 50) + '...');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('Token header removed');
  }
}
