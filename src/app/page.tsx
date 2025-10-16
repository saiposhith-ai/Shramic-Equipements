"use client"; // required if using hooks like useState/useEffect

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <h1 className="text-4xl font-bold mb-4">Shramic Equipments</h1>
      <p className="text-lg mb-6 text-center max-w-lg">
        Welcome to the Equipment Rental and Sales Platform — rent, buy, or chat directly with vendors.
      </p>
      <div className="flex space-x-4">
        <a
          href="/login"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Login
        </a>
        <a
          href="/register"
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          Register
        </a>
      </div>
    </main>
  );
}
