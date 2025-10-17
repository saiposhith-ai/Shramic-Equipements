"use client";
import 'css/shramic-registration.css';

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, User } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Upload, CheckCircle, User as UserIcon, Package, FileText, Shield } from "lucide-react";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

interface SellerData {
  sellerType: "individual" | "company";
  sellerName: string;
  companyName: string;
  email: string;
  phone: string;
  alternativeContact: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  businessRegNumber: string;
  taxId: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  paymentTerms: string;
  cancellationPolicy: string;
  damagePolicy: string;
  insurancePolicy: string;
}

interface EquipmentData {
  title: string;
  category: string;
  brand: string;
  model: string;
  condition: "New" | "Like New" | "Used" | "Well-Maintained" | "Refurbished";
  description: string;
  specifications: string;
  availableFor: "sale" | "rent" | "both";
  salePrice: string;
  rentalPricePerDay: string;
  rentalPricePerWeek: string;
  rentalPricePerMonth: string;
  securityDeposit: string;
  deliveryOption: "pickup" | "delivery" | "both";
  deliveryFee: string;
  pickupLocation: string;
  shippingWeight: string;
  shippingDimensions: string;
  usageGuidelines: string;
  insuranceDetails: string;
  warrantyDetails: string;
  maintenanceHistory: string;
  certifications: string;
  leadTime: string;
  termsAndConditions: string;
}

export default function ShramicRegistration() {
  const [step, setStep] = useState(1);
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
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const [sellerData, setSellerData] = useState<SellerData>({
    sellerType: "individual",
    sellerName: "",
    companyName: "",
    email: "",
    phone: "",
    alternativeContact: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    businessRegNumber: "",
    taxId: "",
    bankAccountNumber: "",
    bankName: "",
    ifscCode: "",
    paymentTerms: "immediate",
    cancellationPolicy: "",
    damagePolicy: "",
    insurancePolicy: ""
  });

  const [equipmentData, setEquipmentData] = useState<EquipmentData>({
    title: "",
    category: "",
    brand: "",
    model: "",
    condition: "Used",
    description: "",
    specifications: "",
    availableFor: "both",
    salePrice: "",
    rentalPricePerDay: "",
    rentalPricePerWeek: "",
    rentalPricePerMonth: "",
    securityDeposit: "",
    deliveryOption: "both",
    deliveryFee: "",
    pickupLocation: "",
    shippingWeight: "",
    shippingDimensions: "",
    usageGuidelines: "",
    insuranceDetails: "",
    warrantyDetails: "",
    maintenanceHistory: "",
    certifications: "",
    leadTime: "",
    termsAndConditions: ""
  });

  useEffect(() => {
    if (recaptchaContainerRef.current && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          {
            size: 'invisible',
            callback: () => console.log("reCAPTCHA verified"),
            'expired-callback': () => {
              console.log("reCAPTCHA expired");
              window.recaptchaVerifier?.render().catch(err => console.error(err));
            }
          }
        );
        window.recaptchaVerifier.render().then(widgetId => {
          console.log("reCAPTCHA widget rendered:", widgetId);
        });
      } catch (error) {
        console.error("Error initializing reCAPTCHA:", error);
        setError("Could not initialize verification. Please refresh the page.");
      }
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, [auth]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingMessage("Sending verification code...");

    if (!window.recaptchaVerifier) {
      setError("reCAPTCHA not initialized. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      let cleanedNumber = phoneNumber.replace(/[\s\-()]/g, '');
      if (!cleanedNumber.startsWith('+')) {
        cleanedNumber = cleanedNumber.length === 10 ? `+91${cleanedNumber}` : `+${cleanedNumber}`;
      }

      const result = await signInWithPhoneNumber(auth, cleanedNumber, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (err: any) {
      console.error("OTP error:", err);
      if (err.code === 'auth/internal-error' && recaptchaContainerRef.current) {
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
          }
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            recaptchaContainerRef.current,
            { size: 'invisible' }
          );
          await window.recaptchaVerifier.render();
          setError("Please try sending the code again.");
        } catch (resetErr) {
          setError("Failed to initialize verification. Please refresh the page.");
        }
      } else {
        setError(err.message || "Failed to send verification code");
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
      setError("Verification session expired. Please request a new code.");
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
      setError("Invalid verification code. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSellerData(prev => ({ ...prev, [name]: value }));
  };

  const handleEquipmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEquipmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const limitedFiles = files.slice(0, 10);
      setImageFiles(limitedFiles);
      const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews(newPreviews);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setDocumentFiles(files.slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User not verified. Cannot submit.");
      return;
    }
    setError("");
    setLoadingMessage("Uploading images...");
    setIsLoading(true);

    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `equipments/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        imageUrls.push(downloadURL);
      }

      setLoadingMessage("Uploading documents...");
      const documentUrls: string[] = [];
      for (const file of documentFiles) {
        const docRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(docRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        documentUrls.push(downloadURL);
      }

      setLoadingMessage("Finalizing registration...");
      await addDoc(collection(db, "equipments"), {
        ...sellerData,
        ...equipmentData,
        imageUrls,
        documentUrls,
        ownerPhoneNumber: user.phoneNumber,
        ownerUid: user.uid,
        salePrice: equipmentData.salePrice ? parseFloat(equipmentData.salePrice) : null,
        rentalPricePerDay: equipmentData.rentalPricePerDay ? parseFloat(equipmentData.rentalPricePerDay) : null,
        rentalPricePerWeek: equipmentData.rentalPricePerWeek ? parseFloat(equipmentData.rentalPricePerWeek) : null,
        rentalPricePerMonth: equipmentData.rentalPricePerMonth ? parseFloat(equipmentData.rentalPricePerMonth) : null,
        securityDeposit: equipmentData.securityDeposit ? parseFloat(equipmentData.securityDeposit) : null,
        deliveryFee: equipmentData.deliveryFee ? parseFloat(equipmentData.deliveryFee) : null,
        createdAt: new Date(),
      });

      setSubmissionSuccess(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 3000);
    } catch (err: any) {
      console.error("Error:", err);
      setError("Failed to register. Please try again.");
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
              step >= s ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 4 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Shramic</h3>
            <p className="text-gray-600">Let's verify your phone number to get started</p>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">📱 Enter your number with country code</span>
              </p>
              <p className="text-xs text-gray-600">Examples: +919876543210 (India), +11234567890 (US)</p>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? loadingMessage : "Send Verification Code"}
            </button>
          </form>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Number</h3>
            <p className="text-gray-600">Enter the 6-digit code sent to {phoneNumber}</p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? loadingMessage : "Verify & Continue"}
            </button>
            <button
              onClick={() => { setStep(1); setError(''); setOtp(''); }}
              type="button"
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change phone number
            </button>
          </form>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Seller Information</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sellerType"
                    value="individual"
                    checked={sellerData.sellerType === "individual"}
                    onChange={handleSellerInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Individual</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sellerType"
                    value="company"
                    checked={sellerData.sellerType === "company"}
                    onChange={handleSellerInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Company</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input type="text" name="sellerName" value={sellerData.sellerName} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
              {sellerData.sellerType === "company" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  <input type="text" name="companyName" value={sellerData.companyName} onChange={handleSellerInputChange} className="input-modern" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input type="email" name="email" value={sellerData.email} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={sellerData.phone} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alternative Contact</label>
                <input type="tel" name="alternativeContact" value={sellerData.alternativeContact} onChange={handleSellerInputChange} className="input-modern" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
              <input type="text" name="address" value={sellerData.address} onChange={handleSellerInputChange} className="input-modern" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <input type="text" name="city" value={sellerData.city} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                <input type="text" name="state" value={sellerData.state} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code *</label>
                <input type="text" name="zipCode" value={sellerData.zipCode} onChange={handleSellerInputChange} className="input-modern" required />
              </div>
            </div>

            {sellerData.sellerType === "company" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration Number</label>
                  <input type="text" name="businessRegNumber" value={sellerData.businessRegNumber} onChange={handleSellerInputChange} className="input-modern" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID / GST Number</label>
                  <input type="text" name="taxId" value={sellerData.taxId} onChange={handleSellerInputChange} className="input-modern" />
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
                  <input type="text" name="bankAccountNumber" value={sellerData.bankAccountNumber} onChange={handleSellerInputChange} className="input-modern" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                  <input type="text" name="bankName" value={sellerData.bankName} onChange={handleSellerInputChange} className="input-modern" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                  <input type="text" name="ifscCode" value={sellerData.ifscCode} onChange={handleSellerInputChange} className="input-modern" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
                  <select name="paymentTerms" value={sellerData.paymentTerms} onChange={handleSellerInputChange} className="input-modern">
                    <option value="immediate">Immediate</option>
                    <option value="7days">7 Days</option>
                    <option value="15days">15 Days</option>
                    <option value="30days">30 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Policies</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
                  <textarea name="cancellationPolicy" value={sellerData.cancellationPolicy} onChange={handleSellerInputChange} className="input-modern" rows={3} placeholder="Describe your cancellation policy..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Damage Policy</label>
                  <textarea name="damagePolicy" value={sellerData.damagePolicy} onChange={handleSellerInputChange} className="input-modern" rows={3} placeholder="Describe your damage policy..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Policy</label>
                  <textarea name="insurancePolicy" value={sellerData.insurancePolicy} onChange={handleSellerInputChange} className="input-modern" rows={3} placeholder="Describe your insurance policy..." />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Identification Documents</label>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentChange} className="file-input-modern" />
              <p className="text-xs text-gray-500 mt-1">Upload ID proof, business registration, etc. (Max 5 files)</p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Continue to Equipment Details
            </button>
          </form>
        </div>
      );
    }

    if (step === 4) {
      if (submissionSuccess) {
        return (
          <div className="text-center py-8">
            <div className="mx-auto bg-gradient-to-r from-green-400 to-green-500 rounded-full h-20 w-20 flex items-center justify-center shadow-lg mb-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 mb-1">Your equipment has been registered successfully.</p>
            <p className="text-gray-500">Redirecting to dashboard...</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Equipment Details</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment Title *</label>
                <input type="text" name="title" value={equipmentData.title} onChange={handleEquipmentInputChange} className="input-modern" placeholder="e.g., Canon EOS 80D Camera" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select name="category" value={equipmentData.category} onChange={handleEquipmentInputChange} className="input-modern" required>
                  <option value="">Select Category</option>
                  <option value="camera">Camera & Photography</option>
                  <option value="heavy-machinery">Heavy Machinery</option>
                  <option value="power-tools">Power Tools</option>
                  <option value="electronics">Electronics</option>
                  <option value="construction">Construction Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand / Manufacturer *</label>
                <input type="text" name="brand" value={equipmentData.brand} onChange={handleEquipmentInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Model Number *</label>
                <input type="text" name="model" value={equipmentData.model} onChange={handleEquipmentInputChange} className="input-modern" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Condition *</label>
                <select name="condition" value={equipmentData.condition} onChange={handleEquipmentInputChange} className="input-modern">
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used</option>
                  <option value="Well-Maintained">Well-Maintained</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <textarea name="description" value={equipmentData.description} onChange={handleEquipmentInputChange} className="input-modern" rows={4} placeholder="Detailed description of the equipment, features, and capabilities..." required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Technical Specifications</label>
              <textarea name="specifications" value={equipmentData.specifications} onChange={handleEquipmentInputChange} className="input-modern" rows={4} placeholder="Size, weight, power requirements, capacity, performance metrics, etc." />
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Availability & Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available For *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="availableFor" value="sale" checked={equipmentData.availableFor === "sale"} onChange={handleEquipmentInputChange} className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Sale Only</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="availableFor" value="rent" checked={equipmentData.availableFor === "rent"} onChange={handleEquipmentInputChange} className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Rent Only</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="availableFor" value="both" checked={equipmentData.availableFor === "both"} onChange={handleEquipmentInputChange} className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Both</span>
                    </label>
                  </div>
                </div>

                {(equipmentData.availableFor === "sale" || equipmentData.availableFor === "both") && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Price (₹) *</label>
                    <input type="number" step="0.01" name="salePrice" value={equipmentData.salePrice} onChange={handleEquipmentInputChange} className="input-modern" required={equipmentData.availableFor === "sale" || equipmentData.availableFor === "both"} />
                  </div>
                )}

                {(equipmentData.availableFor === "rent" || equipmentData.availableFor === "both") && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rental Price Per Day (₹)</label>
                      <input type="number" step="0.01" name="rentalPricePerDay" value={equipmentData.rentalPricePerDay} onChange={handleEquipmentInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rental Price Per Week (₹)</label>
                      <input type="number" step="0.01" name="rentalPricePerWeek" value={equipmentData.rentalPricePerWeek} onChange={handleEquipmentInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rental Price Per Month (₹)</label>
                      <input type="number" step="0.01" name="rentalPricePerMonth" value={equipmentData.rentalPricePerMonth} onChange={handleEquipmentInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Security Deposit (₹)</label>
                      <input type="number" step="0.01" name="securityDeposit" value={equipmentData.securityDeposit} onChange={handleEquipmentInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Time (Days)</label>
                      <input type="text" name="leadTime" value={equipmentData.leadTime} onChange={handleEquipmentInputChange} className="input-modern" placeholder="e.g., 2-3 days" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Delivery & Shipping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Option *</label>
                  <select name="deliveryOption" value={equipmentData.deliveryOption} onChange={handleEquipmentInputChange} className="input-modern">
                    <option value="pickup">Pickup Only</option>
                    <option value="delivery">Delivery Only</option>
                    <option value="both">Both Available</option>
                  </select>
                </div>
                {(equipmentData.deliveryOption === "delivery" || equipmentData.deliveryOption === "both") && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Fee (₹)</label>
                    <input type="number" step="0.01" name="deliveryFee" value={equipmentData.deliveryFee} onChange={handleEquipmentInputChange} className="input-modern" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location *</label>
                  <input type="text" name="pickupLocation" value={equipmentData.pickupLocation} onChange={handleEquipmentInputChange} className="input-modern" placeholder="City, State" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Weight (kg)</label>
                  <input type="text" name="shippingWeight" value={equipmentData.shippingWeight} onChange={handleEquipmentInputChange} className="input-modern" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Dimensions (L x W x H)</label>
                  <input type="text" name="shippingDimensions" value={equipmentData.shippingDimensions} onChange={handleEquipmentInputChange} className="input-modern" placeholder="e.g., 50cm x 30cm x 20cm" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Equipment Images *</span>
              </h4>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photos (Up to 10)</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="file-input-modern" required />
                <p className="text-xs text-gray-500 mt-1">Upload high-quality images from multiple angles</p>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Additional Information</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Guidelines & Safety Instructions</label>
                  <textarea name="usageGuidelines" value={equipmentData.usageGuidelines} onChange={handleEquipmentInputChange} className="input-modern" rows={3} placeholder="Safety instructions, restrictions, user manual references..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance & Liability Details</label>
                  <textarea name="insuranceDetails" value={equipmentData.insuranceDetails} onChange={handleEquipmentInputChange} className="input-modern" rows={3} placeholder="Who is responsible for damage, theft, insurance coverage..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Warranty Details</label>
                  <textarea name="warrantyDetails" value={equipmentData.warrantyDetails} onChange={handleEquipmentInputChange} className="input-modern" rows={2} placeholder="Warranty period, coverage, conditions..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance History</label>
                  <textarea name="maintenanceHistory" value={equipmentData.maintenanceHistory} onChange={handleEquipmentInputChange} className="input-modern" rows={3} placeholder="Last service date, maintenance records, condition notes..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications & Compliance</label>
                  <textarea name="certifications" value={equipmentData.certifications} onChange={handleEquipmentInputChange} className="input-modern" rows={2} placeholder="Safety certifications, electrical safety, compliance documents..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</label>
                  <textarea name="termsAndConditions" value={equipmentData.termsAndConditions} onChange={handleEquipmentInputChange} className="input-modern" rows={4} placeholder="Rental agreement terms, cancellation policy, late return fees, damage charges..." />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Review Your Information</h4>
                  <p className="text-sm text-gray-600">Please ensure all information is accurate before submitting. Once registered, your equipment will be reviewed by our team before going live on the platform.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || submissionSuccess}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? loadingMessage : "Complete Registration"}
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <style>{`
        .input-modern {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 0.75rem;
          transition: all 0.2s;
          outline: none;
        }
        .input-modern:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .file-input-modern {
          display: block;
          width: 100%;
          padding: 0.5rem;
          border: 2px dashed #D1D5DB;
          border-radius: 0.75rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        .file-input-modern:hover {
          border-color: #3B82F6;
          background: #F9FAFB;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4 font-sans">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Shramic
            </h1>
            <p className="text-gray-600">Your Equipment Marketplace</p>
          </div>

          {renderStepIndicator()}

          <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}
            
            {renderStepContent()}
            
            <div ref={recaptchaContainerRef}></div>
          </div>

          <div className="text-center mt-6 text-sm text-gray-600">
            <p>Need help? Contact us at <a href="mailto:support@shramic.com" className="text-blue-600 hover:underline">support@shramic.com</a></p>
          </div>
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