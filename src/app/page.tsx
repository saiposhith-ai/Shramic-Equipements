"use client";

import { ArrowRight, Globe, Users, Zap, Cpu, DollarSign, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 20);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll);
  }

  return (
    <main className="w-full bg-white text-gray-900">
      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Cpu className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Shramic</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition">How It Works</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-sm font-semibold text-blue-600">Global Equipment Network 🌍</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
              Connect. Rent. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Grow.</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              The world's most powerful platform for equipment owners to reach global markets. Rent out your machinery, connect with buyers worldwide, and grow your business without borders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/register"
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl hover:shadow-blue-200 transition-all hover:scale-105"
              >
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition"
              >
                Login
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-6">✓ Free to list • ✓ Global reach • ✓ Secure transactions</p>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="space-y-4">
                  <div className="h-12 bg-white/20 rounded-lg"></div>
                  <div className="h-12 bg-white/20 rounded-lg"></div>
                  <div className="h-12 bg-white/20 rounded-lg"></div>
                  <div className="h-24 bg-white/20 rounded-lg mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Why Choose Shramic?</h2>
            <p className="text-xl text-gray-600">Everything you need to monetize your equipment and reach customers worldwide</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Global Reach",
                description: "Connect with customers across the world. List your equipment once, reach millions of potential renters."
              },
              {
                icon: Users,
                title: "Direct Communication",
                description: "Chat directly with renters and buyers. No middlemen, complete control over your negotiations."
              },
              {
                icon: DollarSign,
                title: "Maximize Revenue",
                description: "Earn from rentals and sales. Set your own prices and terms. Grow your income streams."
              },
              {
                icon: Zap,
                title: "Easy Listing",
                description: "List equipment in minutes. Intuitive tools to showcase your machinery with photos and specifications."
              },
              {
                icon: MessageSquare,
                title: "Instant Notifications",
                description: "Get alerts when renters show interest. Never miss a booking opportunity."
              },
              {
                icon: Cpu,
                title: "Secure Platform",
                description: "Trusted by thousands. Secure transactions, verified users, and protected your business interests."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free account in seconds" },
              { step: "2", title: "List Equipment", desc: "Add your machinery with photos and details" },
              { step: "3", title: "Get Inquiries", desc: "Receive rental and purchase requests" },
              { step: "4", title: "Earn Money", desc: "Complete transactions and grow your business" }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && <div className="hidden md:block absolute right-0 top-1/2 -mr-3 w-6 border-b-2 border-blue-300"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Go Global?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of equipment owners earning money worldwide on Shramic.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105"
            >
              Start Listing Now <ArrowRight className="w-5 h-5 ml-2" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Cpu className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-white">Shramic</span>
              </div>
              <p className="text-sm">Global equipment rental and sales platform</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Browse Equipment</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">List Equipment</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Shramic Equipments. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}