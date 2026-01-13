export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brown-900 text-cream-100">
      {children}
    </div>
  );
}
