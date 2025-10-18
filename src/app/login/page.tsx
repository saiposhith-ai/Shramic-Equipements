"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle, AlertCircle, Smartphone, Clock, Loader } from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Status Check
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [userStatus, setUserStatus] = useState<"approved" | "under_review" | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (recaptchaContainerRef.current && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          { size: "invisible" }
        );
        window.recaptchaVerifier.render();
      } catch (error) {
        console.error("reCAPTCHA error:", error);
      }
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingMessage("Sending verification code...");

    try {
      let cleanedNumber = phoneNumber.replace(/[\s\-()]/g, "");
      if (!cleanedNumber.startsWith("+")) {
        cleanedNumber = cleanedNumber.length === 10 ? `+91${cleanedNumber}` : `+${cleanedNumber}`;
      }

      const result = await signInWithPhoneNumber(auth, cleanedNumber, window.recaptchaVerifier!);
      setConfirmationResult(result);
      setStep(2);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserStatus = async (phoneNum: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage("Checking your account status...");

      const equipmentsRef = collection(db, "equipments");
      const q = query(equipmentsRef, where("ownerPhoneNumber", "==", phoneNum));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No account found. Please register first.");
        setStep(1);
        setIsLoading(false);
        return;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const status = data.status || "under_review";
      const email = data.email || "";

      setUserEmail(email);
      setUserStatus(status as "approved" | "under_review");

      if (status === "approved") {
        router.push("/dashboard");
      } else {
        setStep(3);
      }
    } catch (err: any) {
      setError("Failed to check account status. Please try again.");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingMessage("Verifying code...");

    try {
      const userCredential = await confirmationResult!.confirm(otp);
      const phoneNum = userCredential.user.phoneNumber || "";
      await checkUserStatus(phoneNum);
    } catch (err: any) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError("");
    setIsLoading(true);
    setLoadingMessage("Resending code...");

    try {
      let cleanedNumber = phoneNumber.replace(/[\s\-()]/g, "");
      if (!cleanedNumber.startsWith("+")) {
        cleanedNumber = cleanedNumber.length === 10 ? `+91${cleanedNumber}` : `+${cleanedNumber}`;
      }

      const result = await signInWithPhoneNumber(auth, cleanedNumber, window.recaptchaVerifier!);
      setConfirmationResult(result);
      setOtp("");
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Phone Input
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mx-auto bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full h-20 w-20 flex items-center justify-center"
              >
                <Smartphone className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h1>
                <p className="text-gray-600">Sign in with your mobile number</p>
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">Mobile Number *</label>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+\-\s()]/g, ""))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-transparent text-lg font-medium outline-none placeholder-gray-400"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">We'll send a 6-digit verification code to this number</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>© 2025 Shramic Networks Pvt Ltd.</p>
            </div>
          </div>
        </motion.div>

        <div ref={recaptchaContainerRef} className="sr-only" />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl max-w-md"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full h-20 w-20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Verify Your Number</h2>
                <p className="text-gray-600">Enter the 6-digit code sent to {phoneNumber}</p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">Verification Code *</label>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full text-center text-4xl font-mono font-bold tracking-widest bg-transparent outline-none text-gray-800"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Check your SMS for the code</p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                ) : (
                  "Verify & Login"
                )}
              </button>
            </form>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setPhoneNumber("+91");
                }}
                className="w-full text-emerald-600 hover:text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Change Phone Number
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend code in <span className="font-bold text-gray-700">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                )}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>© 2025 Shramic Networks Pvt Ltd.</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl max-w-md"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Step 3: Status Check
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-full h-28 w-28 flex items-center justify-center"
            >
              <Clock className="w-14 h-14 text-amber-600" />
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-gray-800">Account Under Review</h2>
              <p className="text-lg text-gray-600">We're verifying your information</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 space-y-3">
              <p className="text-gray-700">
                Thank you for registering with Shramic! Your account is currently under review by our verification team.
              </p>
              <p className="text-sm text-gray-600">
                This typically takes <strong>24-48 hours</strong>. Once approved, you'll be able to access your full dashboard.
              </p>
            </div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="space-y-2"
            >
              <div className="flex justify-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-3 h-3 bg-amber-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 bg-amber-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 bg-amber-500 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-500">Please wait...</p>
            </motion.div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Confirmation Email:</strong> {userEmail}
              </p>
              <p className="text-xs text-gray-600">
                We'll send you an email notification once your account is approved.
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
                setPhoneNumber("+91");
                setUserStatus(null);
                setUserEmail("");
              }}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Back to Login
            </button>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">Need help? Contact us at</p>
              <a href="mailto:support@shramic.com" className="text-amber-600 hover:text-amber-700 font-semibold">
                support@shramic.com
              </a>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>© 2025 Shramic Networks Pvt Ltd.</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl max-w-md"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}