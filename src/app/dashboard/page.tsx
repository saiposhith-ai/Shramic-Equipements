"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Menu, X, Settings, Bell, MessageSquare, TrendingUp, AlertCircle,
  Wrench, Calendar, DollarSign, Package, Zap, TrendingDown, Clock,
  CheckCircle, XCircle, Eye, EyeOff
} from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

interface Equipment {
  id: string;
  brand: string;
  modelName: string;
  category: string;
  subCategory: string;
  equipmentTitle: string;
  currentStatus?: string;
  [key: string]: any;
}

interface Booking {
  bookingId: string;
  renterName?: string;
  totalAmount?: number;
  status?: string;
  startDate?: any;
  [key: string]: any;
}

interface OwnerData {
  name: string;
  email: string;
  company: string;
}

interface Earnings {
  today: number;
  month: number;
  lifetime: number;
  pending: number;
}

const Dashboard = () => {
  const router = useRouter();
  
  // Initialize Firebase
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, month: 0, lifetime: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Wait for auth state to load
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        fetchDashboardData();
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.phoneNumber) return;

      // Fetch equipment list
      const equipmentRef = collection(db, "equipments");
      const equipmentQuery = query(equipmentRef, where("ownerPhoneNumber", "==", user.phoneNumber));
      const equipmentSnapshot = await getDocs(equipmentQuery);

      const equipment: Equipment[] = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Equipment));

      setEquipmentList(equipment);

      // Fetch owner details
      if (equipmentSnapshot.docs.length > 0) {
        const firstEquipmentData = equipmentSnapshot.docs[0].data();
        setOwnerData({
          name: firstEquipmentData.ownerName,
          email: firstEquipmentData.email,
          company: firstEquipmentData.companyName || "Individual Owner"
        });
      }

      // Fetch bookings for all equipment
      const bookingsRef = collection(db, "bookings");
      let allBookings: Booking[] = [];
      for (const equip of equipment) {
        const bookingQuery = query(bookingsRef, where("equipmentId", "==", equip.id));
        const bookingSnapshot = await getDocs(bookingQuery);
        allBookings = [...allBookings, ...bookingSnapshot.docs.map(doc => ({ bookingId: doc.id, ...doc.data() } as Booking))];
      }
      setBookings(allBookings);

      // Calculate earnings
      calculateEarnings(allBookings);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (bookingsList: Booking[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let todayEarnings = 0;
    let monthEarnings = 0;
    let lifetimeEarnings = 0;
    let pendingPayouts = 0;

    bookingsList.forEach((booking: Booking) => {
      const amount = booking.totalAmount || 0;
      const bookingDate = booking.startDate?.toDate?.() || new Date(booking.startDate);

      lifetimeEarnings += amount;

      if (booking.status === "completed") {
        if (bookingDate.toDateString() === today.toDateString()) {
          todayEarnings += amount;
        }
        if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
          monthEarnings += amount;
        }
      } else if (booking.status === "confirmed" || booking.status === "ongoing") {
        pendingPayouts += amount;
      }
    });

    setEarnings({ today: todayEarnings, month: monthEarnings, lifetime: lifetimeEarnings, pending: pendingPayouts });
  };

  const equipmentStats = {
    total: equipmentList.length,
    available: equipmentList.filter(e => e.currentStatus === "Available" || !e.currentStatus).length,
    rented: equipmentList.filter(e => e.currentStatus === "Rented").length,
    maintenance: equipmentList.filter(e => e.currentStatus === "Maintenance").length
  };

  const bookingStats = {
    upcoming: bookings.filter(b => b.status === "pending" || b.status === "confirmed").length,
    ongoing: bookings.filter(b => b.status === "ongoing").length,
    completed: bookings.filter(b => b.status === "completed").length
  };

  const toggleEquipmentStatus = async (equipmentId: string, newStatus: string) => {
    try {
      const equipmentRef = doc(db, "equipments", equipmentId);
      await updateDoc(equipmentRef, { currentStatus: newStatus });
      setEquipmentList(equipmentList.map(e => e.id === equipmentId ? { ...e, currentStatus: newStatus } : e));
    } catch (error) {
      console.error("Error updating equipment status:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Zap className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Sidebar */}
      <motion.aside
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-screen w-72 bg-gray-950 border-r border-gray-700 p-6 overflow-y-auto z-40"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Shramic
          </h1>
          <p className="text-xs text-gray-500 mt-1">Equipment Management</p>
        </div>

        <nav className="space-y-2 mb-8">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "equipment", label: "Equipment", icon: Package },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "earnings", label: "Earnings", icon: DollarSign },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
            { id: "messages", label: "Messages", icon: MessageSquare }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "ml-72" : "ml-0"}`}>
        {/* Header */}
        <header className="sticky top-0 bg-gray-950 border-b border-gray-700 p-6 flex justify-between items-center z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
            <Settings className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full" />
          </div>
        </header>

        <main className="p-8 space-y-8">
          {/* Welcome Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="text-4xl font-bold">Welcome back, {ownerData?.name ?? "Owner"}</h1>
            <p className="text-gray-400">{ownerData?.company ?? "Loading..."}</p>
          </motion.div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Equipment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-emerald-500 transition-colors"
                >
                  <Package className="w-8 h-8 text-emerald-400 mb-4" />
                  <p className="text-gray-400 text-sm">Total Equipment</p>
                  <p className="text-3xl font-bold mt-2">{equipmentStats.total}</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-green-900/30 to-gray-900 p-6 rounded-xl border border-green-700/50 hover:border-green-500 transition-colors"
                >
                  <CheckCircle className="w-8 h-8 text-green-400 mb-4" />
                  <p className="text-gray-400 text-sm">Available</p>
                  <p className="text-3xl font-bold mt-2">{equipmentStats.available}</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-blue-900/30 to-gray-900 p-6 rounded-xl border border-blue-700/50 hover:border-blue-500 transition-colors"
                >
                  <Zap className="w-8 h-8 text-blue-400 mb-4" />
                  <p className="text-gray-400 text-sm">Rented</p>
                  <p className="text-3xl font-bold mt-2">{equipmentStats.rented}</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-orange-900/30 to-gray-900 p-6 rounded-xl border border-orange-700/50 hover:border-orange-500 transition-colors"
                >
                  <Wrench className="w-8 h-8 text-orange-400 mb-4" />
                  <p className="text-gray-400 text-sm">Maintenance</p>
                  <p className="text-3xl font-bold mt-2">{equipmentStats.maintenance}</p>
                </motion.div>
              </div>

              {/* Earnings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Today", value: earnings.today, icon: Calendar, color: "from-blue-600 to-blue-400" },
                  { label: "This Month", value: earnings.month, icon: TrendingUp, color: "from-emerald-600 to-emerald-400" },
                  { label: "Lifetime", value: earnings.lifetime, icon: TrendingUp, color: "from-purple-600 to-purple-400" },
                  { label: "Pending Payout", value: earnings.pending, icon: Clock, color: "from-yellow-600 to-yellow-400" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className={`bg-gradient-to-br ${item.color}/20 p-6 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors`}
                    >
                      <Icon className={`w-8 h-8 mb-4 text-${item.color.split("-")[1]}-400`} />
                      <p className="text-gray-400 text-sm">{item.label}</p>
                      <p className="text-3xl font-bold mt-2">₹{item.value.toLocaleString()}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bookings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Upcoming Requests", count: bookingStats.upcoming, color: "text-blue-400" },
                  { label: "Ongoing Rentals", count: bookingStats.ongoing, color: "text-green-400" },
                  { label: "Completed", count: bookingStats.completed, color: "text-purple-400" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-emerald-500 transition-colors"
                  >
                    <p className="text-gray-400 text-sm mb-4">{item.label}</p>
                    <p className={`text-4xl font-bold ${item.color}`}>{item.count}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Equipment Tab */}
          {activeTab === "equipment" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold">Your Equipment</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {equipmentList.map((equip, idx) => (
                  <motion.div
                    key={equip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{equip.brand} {equip.modelName}</h3>
                        <p className="text-gray-400 text-sm">{equip.category} - {equip.subCategory}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        equip.currentStatus === "Available" ? "bg-green-500/20 text-green-400" :
                        equip.currentStatus === "Rented" ? "bg-blue-500/20 text-blue-400" :
                        "bg-orange-500/20 text-orange-400"
                      }`}>
                        {equip.currentStatus || "Available"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{equip.equipmentTitle}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleEquipmentStatus(equip.id, "Available")}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                      >
                        Available
                      </button>
                      <button
                        onClick={() => toggleEquipmentStatus(equip.id, "Maintenance")}
                        className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors"
                      >
                        Maintenance
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold">Recent Bookings</h2>
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex justify-between items-center hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{booking.renterName || "Renter"}</p>
                      <p className="text-gray-400 text-sm">₹{booking.totalAmount || 0}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      booking.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                      booking.status === "ongoing" ? "bg-green-500/20 text-green-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {(booking.status ?? "pending").charAt(0).toUpperCase() + (booking.status ?? "pending").slice(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold">Earnings & Payouts</h2>
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-gray-400 mb-2">Total This Month</p>
                    <p className="text-4xl font-bold text-emerald-400">₹{earnings.month.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">Pending Payout</p>
                    <p className="text-4xl font-bold text-yellow-400">₹{earnings.pending.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold">Maintenance & Service</h2>
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">
                <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Maintenance logs for your equipment will appear here</p>
              </div>
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold">Messages</h2>
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Real-time chat with renters coming soon</p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;