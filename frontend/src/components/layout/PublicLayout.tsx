import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

export default function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      
      {/* Основной контент страницы будет рендериться здесь */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}