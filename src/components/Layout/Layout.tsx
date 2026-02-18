import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Navigation from '../Navigation/Navigation';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Header />
      <Navigation />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
