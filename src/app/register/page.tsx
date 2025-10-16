"use client";

import { useState, useEffect, useRef } from "react";
// Removed Next.js-specific router to resolve compilation issues in a generic environment.
// Navigation will be handled by standard web APIs.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, User } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Firebase Initialization ---
// FIXED: Replaced the undefined '__firebase_config' with a standard config object.
// TODO: Replace the placeholder values below with your actual Firebase project's configuration.
const firebaseConfig = {
  apiKey: "AIzaSyAYEG2XdbuQlGflMwppjtj54ur4jKs89-A",
  authDomain: "kaamon6363.firebaseapp.com",
  projectId: "kaamon6363",
  storageBucket: "kaamon6363.firebasestorage.app",
  messagingSenderId: "582122881331",
  appId: "1:582122881331:web:8fac47d3e8646e56a47e46",
  measurementId: "G-7GFJK5G724"
};


// Standard pattern to prevent re-initializing Firebase in a hot-reload environment.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Define the structure of the equipment data for better type safety
interface EquipmentData {
  manufacturer: string;
  model: string;
  year: string;
  category: string;
  operatingHours: string;
  serialNumber: string;
  condition: "New" | "Used" | "Well-Maintained" | "Refurbished";
  locationCity: string;
  locationState: string;
  locationZip: string;
  askingPrice: string;
  description: string;
  sellerName: string;
  sellerEmail: string;
}

export default function RegisterEquipmentPage() {
  const [step, setStep] = useState(1);
  // MODIFIED: Set the initial phone number state to "+91" for India.
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Sending OTP...");
  const [error, setError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const [equipmentData, setEquipmentData] = useState<EquipmentData>({
    manufacturer: "", model: "", year: "", category: "",
    operatingHours: "", serialNumber: "", condition: "Used",
    locationCity: "", locationState: "", locationZip: "",
    askingPrice: "", description: "", sellerName: "", sellerEmail: ""
  });


  // Effect to initialize and clean up the reCAPTCHA verifier
  // --- Initialize and render reCAPTCHA ---
useEffect(() => {
  if (recaptchaContainerRef.current && !window.recaptchaVerifier) {
    try {
      // Create invisible reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier(
        recaptchaContainerRef.current,
        {
          size: 'invisible',
          callback: () => console.log("reCAPTCHA verified"),
          'expired-callback': () => {
            console.log("reCAPTCHA expired, re-rendering");
            window.recaptchaVerifier?.render().catch(err => console.error(err));
          }
        },
        auth
      );

      // Explicitly render reCAPTCHA and get widgetId
      window.recaptchaVerifier.render().then(widgetId => {
        console.log("reCAPTCHA widget rendered with ID:", widgetId);
      });

      console.log("reCAPTCHA verifier initialized");
    } catch (error) {
      console.error("Error initializing reCAPTCHA:", error);
      setError("Could not initialize verification. Please refresh the page.");
    }
  }

  return () => {
    // Clean up
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
  };
}, [auth]);
// Added auth as a dependency

 const handleSendOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);
  setLoadingMessage("Sending OTP...");

  if (!window.recaptchaVerifier) {
    setError("reCAPTCHA not initialized. Refresh page.");
    setIsLoading(false);
    return;
  }

  try {
    let cleanedNumber = phoneNumber.replace(/[\s\-()]/g, '');
    if (!cleanedNumber.startsWith('+')) {
      cleanedNumber = cleanedNumber.length === 10 ? `+91${cleanedNumber}` : `+${cleanedNumber}`;
    }

    console.log("Attempting to send OTP to:", cleanedNumber);
    const result = await signInWithPhoneNumber(auth, cleanedNumber, window.recaptchaVerifier);
    setConfirmationResult(result);
    setStep(2);
  } catch (err: any) {
    console.error("OTP error:", err);
    
    // If verifier was destroyed, try to recreate it
    if (err.code === 'auth/internal-error' && recaptchaContainerRef.current) {
      console.log("Attempting to recreate reCAPTCHA verifier...");
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }
        window.recaptchaVerifier = new RecaptchaVerifier(
          recaptchaContainerRef.current,
          { size: 'invisible' },
          auth
        );
        await window.recaptchaVerifier.render();
        setError("Please try sending the code again.");
      } catch (resetErr) {
        setError("Failed to initialize verification. Please refresh the page.");
      }
    } else {
      setError(err.message || "Failed to send OTP");
    }
  } finally {
    setIsLoading(false);
  }
};



  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingMessage("Verifying...");
    setIsLoading(true);
    
    if (!confirmationResult) {
      setError("Verification session expired. Please request a new OTP.");
      setIsLoading(false);
      setStep(1);
      return;
    }
    
    try {
      const result = await confirmationResult.confirm(otp);
      setUser(result.user);
      setStep(3);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Invalid OTP. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEquipmentData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 5 images
      const limitedFiles = files.slice(0, 5);
      setImageFiles(limitedFiles);

      const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
      // Clean up old object URLs to prevent memory leaks
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews(newPreviews);
    }
  };

  const handleRegisterEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("User not verified. Cannot submit.");
        return;
    }
    setError("");
    setLoadingMessage("Submitting...");
    setIsLoading(true);

    try {
        // 1. Upload Images to Firebase Storage
        setLoadingMessage("Uploading images...");
        const imageUrls: string[] = [];
        for (const file of imageFiles) {
            const imageRef = ref(storage, `equipments/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            imageUrls.push(downloadURL);
        }

        // 2. Add Equipment Data (including image URLs) to Firestore
        setLoadingMessage("Finalizing registration...");
        await addDoc(collection(db, "equipments"), {
            ...equipmentData,
            imageUrls, // Add the array of image URLs
            ownerPhoneNumber: user.phoneNumber,
            ownerUid: user.uid,
            year: equipmentData.year ? parseInt(equipmentData.year, 10) : null,
            operatingHours: equipmentData.operatingHours ? parseInt(equipmentData.operatingHours, 10) : null,
            askingPrice: equipmentData.askingPrice ? parseFloat(equipmentData.askingPrice) : null,
            createdAt: new Date(),
        });

        setSubmissionSuccess(true);
        // Corrected: Use standard browser navigation.
        setTimeout(() => { window.location.href = "/dashboard"; }, 2500);

    } catch (err: any) {
        console.error("Error adding document: ", err);
        setError("Failed to register equipment. Please try again.");
        setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <p className="text-center text-gray-600 mb-2">First, let's verify your phone number.</p>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700 mb-2 border border-blue-200">
              <p className="font-semibold mb-1">Please enter your number with country code:</p>
              <p>Examples: +919876543210 (India), +11234567890 (US)</p>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? loadingMessage : "Send Verification Code"}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p className="text-center text-gray-600">Enter the 6-digit code sent to {phoneNumber}</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="border p-3 rounded-lg text-center tracking-[0.5em] focus:ring-2 focus:ring-green-500 focus:outline-none transition"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? loadingMessage : "Verify & Continue"}
            </button>
            <button
              onClick={() => { setStep(1); setError(''); setOtp(''); }}
              type="button"
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Change phone number
            </button>
          </form>
        );
      case 3:
        if (submissionSuccess) {
          return (
            <div className="text-center transition-opacity duration-500">
                <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mt-4">Success!</h3>
                <p className="text-gray-600 mt-2">Your equipment has been registered successfully.</p>
                <p className="text-gray-500 mt-1">Redirecting you to the dashboard...</p>
            </div>
          );
        }
        return (
            <form onSubmit={handleRegisterEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <h3 className="md:col-span-2 text-xl font-semibold text-gray-700 border-b pb-2 mb-2">Equipment Details</h3>
                <div><label className="block text-sm font-medium text-gray-700">Manufacturer</label><input type="text" name="manufacturer" value={equipmentData.manufacturer} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Model</label><input type="text" name="model" value={equipmentData.model} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Year</label><input type="number" name="year" value={equipmentData.year} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Category</label><input type="text" name="category" value={equipmentData.category} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Operating Hours</label><input type="number" name="operatingHours" value={equipmentData.operatingHours} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Serial Number</label><input type="text" name="serialNumber" value={equipmentData.serialNumber} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Asking Price ($)</label><input type="number" step="0.01" name="askingPrice" value={equipmentData.askingPrice} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Condition</label><select name="condition" value={equipmentData.condition} onChange={handleInputChange} className="mt-1 input-field"><option>New</option><option>Used</option><option>Well-Maintained</option><option>Refurbished</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Location</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1"><input type="text" name="locationCity" value={equipmentData.locationCity} onChange={handleInputChange} placeholder="City" className="input-field" required /><input type="text" name="locationState" value={equipmentData.locationState} onChange={handleInputChange} placeholder="State / Province" className="input-field" required /><input type="text" name="locationZip" value={equipmentData.locationZip} onChange={handleInputChange} placeholder="ZIP / Postal Code" className="input-field" required /></div></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" value={equipmentData.description} onChange={handleInputChange} className="mt-1 input-field" rows={4} required></textarea></div>
                
                <h3 className="md:col-span-2 text-xl font-semibold text-gray-700 border-b pb-2 mb-2 mt-4">Equipment Images</h3>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Upload Photos (Up to 5)</label>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                            <img key={index} src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg shadow-md"/>
                        ))}
                    </div>
                </div>

                <h3 className="md:col-span-2 text-xl font-semibold text-gray-700 border-b pb-2 mb-2 mt-4">Seller Information</h3>
                <div><label className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" name="sellerName" value={equipmentData.sellerName} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Email Address</label><input type="email" name="sellerEmail" value={equipmentData.sellerEmail} onChange={handleInputChange} className="mt-1 input-field" required /></div>
                <div className="md:col-span-2 mt-6">
                    <button type="submit" disabled={isLoading || submissionSuccess} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? loadingMessage : "Complete Registration"}
                    </button>
                </div>
            </form>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        .input-field {
          display: block; width: 100%; border-width: 1px;
          border-color: #D1D5DB; padding: 0.75rem; border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          outline: none; border-color: #3B82F6;
          box-shadow: 0 0 0 2px #BFDBFE;
        }
      `}</style>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Register Your Equipment
          </h2>

          {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center border border-red-200">{error}</p>}
          
          {renderStepContent()}
          
          <div ref={recaptchaContainerRef}></div>
        </div>
      </div>
    </>
  );
}

declare global {
    interface Window {
      recaptchaVerifier?: RecaptchaVerifier;
    }
}