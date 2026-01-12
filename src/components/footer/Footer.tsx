import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-end px-4">
        <Link href="/admin" className="text-sm hover:underline">
          Admin
        </Link>
      </div>
    </footer>
  );
}
