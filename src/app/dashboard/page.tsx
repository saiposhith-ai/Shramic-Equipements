"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, {user?.email}</h1>
      <p className="text-gray-600 mt-2">Manage your equipment, quotes, and chats.</p>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <Link href="/dashboard/equipment" className="bg-blue-100 p-6 rounded-lg hover:bg-blue-200">
          Equipment
        </Link>
        <Link href="/dashboard/quotes" className="bg-green-100 p-6 rounded-lg hover:bg-green-200">
          Quotes
        </Link>
        <Link href="/dashboard/chat" className="bg-yellow-100 p-6 rounded-lg hover:bg-yellow-200">
          Chat
        </Link>
      </div>

      <button onClick={logout} className="mt-6 bg-red-500 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
