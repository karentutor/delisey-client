import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../../components/nav/Navbar'; // adjust if needed

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
