import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import Swal from 'sweetalert2';

// Overriding default native window.alert with high-contrast SweetAlert2
window.alert = (message: string) => {
  Swal.fire({
    text: message,
    icon: 'info',
    confirmButtonText: 'متوجه شدم',
    customClass: {
      confirmButton: 'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition',
      popup: 'rounded-3xl border border-slate-200 shadow-2xl p-6 font-sans'
    },
    buttonsStyling: false
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
