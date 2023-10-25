import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/Home';
import SettingPage from '@/pages/Setting';

const routes = createBrowserRouter([
  {
    path: 'setting',
    element: <SettingPage />,
  }, {
    path: '/',
    element: <HomePage />,
  },
]);

export default routes;
