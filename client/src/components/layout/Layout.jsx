import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
