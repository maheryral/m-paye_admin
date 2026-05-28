import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KycReview from './pages/KycReview';
import KycDetail from './pages/KycDetail';
import Withdrawals from './pages/Withdrawals';
import PaymentRequests from './pages/PaymentRequests';
import Fees from './pages/Fees';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Refunds from './pages/Refunds';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import Broadcast from './pages/Broadcast';
import Exports from './pages/Exports';
import Security from './pages/Security';
import FxRates from './pages/FxRates';
import Reclamations from './pages/Reclamations';
import Wallets from './pages/Wallets';
import Audit from './pages/Audit';
import Compliance from './pages/Compliance';
import Ops from './pages/Ops';
import Transport from './pages/Transport';
import Telepherique from './pages/Telepherique';
import VoyageDetail from './pages/VoyageDetail';
import SeatLayoutEditor from './pages/SeatLayoutEditor';
import Admins from './pages/Admins';
import Marketing from './pages/Marketing';
import Comms from './pages/Comms';
import SecurityPlus from './pages/SecurityPlus';
import Security2FA from './pages/Security2FA';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'kyc', element: <KycReview /> },
      { path: 'kyc/:id', element: <KycDetail /> },
      { path: 'merchants', element: <Merchants /> },
      { path: 'merchants/:id', element: <MerchantDetail /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'transactions/:id', element: <TransactionDetail /> },
      { path: 'refunds', element: <Refunds /> },
      { path: 'withdrawals', element: <Withdrawals /> },
      { path: 'payment-requests', element: <PaymentRequests /> },
      { path: 'wallets', element: <Wallets /> },
      { path: 'fees', element: <Fees /> },
      { path: 'fx-rates', element: <FxRates /> },
      { path: 'users', element: <Users /> },
      { path: 'users/:id', element: <UserDetail /> },
      { path: 'security', element: <Security /> },
      { path: 'compliance', element: <Compliance /> },
      { path: 'ops', element: <Ops /> },
      { path: 'transport', element: <Transport /> },
      { path: 'transport/telepherique', element: <Telepherique /> },
      { path: 'transport/voyages/:id', element: <VoyageDetail /> },
      { path: 'transport/voitures/:id/layout', element: <SeatLayoutEditor /> },
      { path: 'admins', element: <Admins /> },
      { path: 'marketing', element: <Marketing /> },
      { path: 'comms', element: <Comms /> },
      { path: 'security-plus', element: <SecurityPlus /> },
      { path: 'my-2fa', element: <Security2FA /> },
      { path: 'audit', element: <Audit /> },
      { path: 'reclamations', element: <Reclamations /> },
      { path: 'broadcast', element: <Broadcast /> },
      { path: 'messages', element: <Messages /> },
      { path: 'exports', element: <Exports /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
