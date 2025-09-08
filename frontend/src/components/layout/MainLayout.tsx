import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      <main>
        {/* This Outlet is a placeholder where your pages (Dashboard, Team, etc.) will be rendered */}
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;