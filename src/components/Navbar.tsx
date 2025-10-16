"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-blue-600">
        EquipRent
      </Link>
      <div className="space-x-4">
        {user ? (
          <Link href="/dashboard" className="text-blue-500">Dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="text-blue-500">Login</Link>
            <Link href="/register" className="text-blue-500">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
