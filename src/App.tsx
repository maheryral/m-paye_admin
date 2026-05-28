import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { AdminSocketProvider } from './contexts/AdminSocketContext';
import { router } from './router';

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AdminSocketProvider>
          <RouterProvider router={router} />
        </AdminSocketProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
