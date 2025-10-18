"use client";

import { useState, useEffect, useRef, memo } from "react"; // Import memo
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, User } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Upload, CheckCircle, User as UserIcon, Package, FileText, Shield, Phone, Mail, MapPin, Building, CreditCard, File, AlertCircle, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase config (remains the same)
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

// Interfaces (remain the same)
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

// FIX 1: Wrap functional components with React.memo for performance optimization
const InputField = memo(({ label, name, value, onChange, type = "text", required = false, placeholder = "", rows, className = "" }: any) => (
  <div className="space-y-1 group">
    <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows || 3}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none hover:shadow-md ${className}`}
        required={required}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md ${className}`}
        required={required}
      />
    )}
  </div>
));

const SelectField = memo(({ label, name, value, onChange, children, required = false }: any) => (
  <motion.div className="space-y-1 group" whileHover={{ y: -2 }}>
    <label className="block text-sm font-semibold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <motion.select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md cursor-pointer"
      required={required}
      whileFocus={{ scale: 1.02 }}
    >
      {children}
    </motion.select>
  </motion.div>
));

const FileInput = memo(({ label, onChange, accept, multiple = true, maxFiles, required = false }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length, 'files');
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="space-y-2 group">
      <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onClick={handleClick}
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-emerald-400 transition-all duration-300 cursor-pointer overflow-hidden group-hover:shadow-lg"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          required={required}
        />
        <div className="text-center flex flex-col items-center space-y-3 pointer-events-none">
          <div className="p-3 bg-white rounded-full shadow-lg">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300" />
          </div>
          <p className="text-sm text-gray-600 group-hover:text-gray-800 font-medium">
            Click or drag to upload
          </p>
          {maxFiles && <p className="text-xs text-gray-400">Max {maxFiles} files</p>}
        </div>
      </div>
    </div>
  );
});
const RadioGroup = memo(({ name, value, onChange, options, title }: any) => (
    <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((option: any, index: number) => (
                <motion.label
                    key={option.value}
                    className="relative p-5 border border-gray-200 rounded-xl hover:border-emerald-300 cursor-pointer transition-all duration-300 group overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(16, 185, 129, 0.15)" }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={onChange}
                        className="absolute opacity-0 w-0 h-0"
                    />
                    <div className="flex items-center space-x-3 relative z-10">
                        <motion.div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${value === option.value ? 'bg-gradient-to-r from-emerald-500 to-blue-600 border-transparent' : 'border-gray-300'
                                }`}
                            animate={value === option.value ? { scale: 1.2 } : {}}
                        >
                            {value === option.value && <Sparkles className="w-3 h-3 text-white" />}
                        </motion.div>
                        <div>
                            <div className="font-semibold text-gray-800">{option.label}</div>
                            <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                    </div>
                </motion.label>
            ))}
        </div>
    </div>
));


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
  
  // All hooks and handlers from your original code remain here...
  // ... (useEffect, handleSendOtp, handleVerifyOtp, etc.)
  // No changes are needed in the logic, only in the JSX rendering.

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center mb-12"
    >
      <div className="flex items-center space-x-6 bg-white/90 backdrop-blur-sm px-8 py-4 rounded-3xl shadow-xl border border-gray-100/50">
        <AnimatePresence>
          {[1, 2, 3, 4].map((s, index) => (
            <motion.div
              key={s}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: step >= s ? 1 : 0.8, opacity: step >= s ? 1 : 0.5 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center relative"
            >
              <motion.div
                className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white shadow-lg ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                  }`}
                whileHover={step >= s ? { scale: 1.05, rotate: 5 } : {}}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </motion.div>
              {s < 4 && (
                <motion.div
                  className={`absolute top-6 left-full w-16 h-1 transform -translate-x-6 ${step > s ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600' : 'bg-gray-200'}`}
                  initial={{ width: 0 }}
                  animate={{ width: step > s ? '4rem' : 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <motion.div
          key="step1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100 px-6 py-3 rounded-full shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Phone className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-800">AI-Powered Secure Verification</h3>
            </motion.div>
            <motion.p
              className="text-gray-600 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Experience seamless identity verification tailored for enterprise security.
            </motion.p>
          </motion.div>
          <form onSubmit={handleSendOtp} className="space-y-6">
            <motion.div
              className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-8 rounded-3xl border border-emerald-100 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Phone className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Enter your enterprise mobile number</span>
              </div>
              <p className="text-xs text-gray-600 mb-6">Supports global formats with AI-enhanced validation.</p>
              {/* FIX 2: Removed problematic 'whileFocus' animation */}
              <motion.input
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                  setPhoneNumber(value);
                }}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            </motion.div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center space-x-2"
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>{loadingMessage}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Send Verification Code
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          key="step2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 via-emerald-100 to-purple-100 px-6 py-3 rounded-full shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircle className="w-5 h-5 text-blue-600 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-800">AI-Enhanced Identity Confirmation</h3>
            </motion.div>
            <motion.p
              className="text-gray-600 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Input the 6-digit code delivered to <span className="font-semibold text-emerald-600">{phoneNumber}</span>
            </motion.p>
          </motion.div>
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <motion.div
              className="bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50 p-8 rounded-3xl border border-blue-100 shadow-xl relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* FIX 3: Added a key to the OTP input field */}
              <InputField
                key="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                label=""
                className="text-center text-3xl font-mono tracking-widest bg-transparent border-0 focus:ring-0"
              />
              <motion.div
                className="absolute top-4 right-4 text-xs text-gray-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Resend in 30s
              </motion.div>
            </motion.div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-blue-600 hover:via-emerald-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    className="flex items-center justify-center space-x-2"
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>{loadingMessage}</span>
                  </motion.span>
                ) : (
                  <motion.span key="verify">Verify & Unlock Enterprise Access</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              onClick={() => { setStep(1); setError(''); setOtp(''); }}
              type="button"
              className="w-full text-sm text-gray-600 hover:text-emerald-600 font-medium transition-all duration-300 flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Modify Contact Details</span>
            </motion.button>
          </form>
        </motion.div>
      );
    }

    if (step === 3) {
      return (
        <motion.div
          key="step3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-3 mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UserIcon className="w-7 h-7 text-gradient-to-r from-emerald-600 via-blue-600 to-purple-600" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-800">Enterprise Profile Builder</h3>
          </motion.div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-8">
            <motion.div
              className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-8 rounded-3xl border border-emerald-100 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <RadioGroup
                name="sellerType"
                value={sellerData.sellerType}
                onChange={handleSellerInputChange}
                options={[
                  { value: "individual", label: "Solo Entrepreneur", desc: "Personalized equipment offerings" },
                  { value: "company", label: "Corporate Entity", desc: "Scalable business inventory management" }
                ]}
                title="Business Structure"
              />
            </motion.div>
            
            {/* FIX 4: Added key props to all InputField components */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              animate="visible"
              transition={{ staggerChildren: 0.1 }}
            >
              <InputField
                key="sellerName"
                label="Executive Name"
                name="sellerName"
                value={sellerData.sellerName}
                onChange={handleSellerInputChange}
                required
              />
              {sellerData.sellerType === "company" && (
                <InputField
                  key="companyName"
                  label="Corporate Entity Name"
                  name="companyName"
                  value={sellerData.companyName}
                  onChange={handleSellerInputChange}
                  required
                />
              )}
              <InputField
                key="email"
                type="email"
                label="Corporate Email"
                name="email"
                value={sellerData.email}
                onChange={handleSellerInputChange}
                required
              />
              <InputField
                key="phone"
                type="tel"
                label="Primary Hotline"
                name="phone"
                value={sellerData.phone}
                onChange={handleSellerInputChange}
                required
              />
              <InputField
                key="alternativeContact"
                type="tel"
                label="Secondary Contact"
                name="alternativeContact"
                value={sellerData.alternativeContact}
                onChange={handleSellerInputChange}
              />
            </motion.div>

            <InputField
              key="address"
              label="Headquarters Address"
              name="address"
              value={sellerData.address}
              onChange={handleSellerInputChange}
              required
            />

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              animate="visible"
              transition={{ staggerChildren: 0.1 }}
            >
              <InputField
                key="city"
                label="City Hub"
                name="city"
                value={sellerData.city}
                onChange={handleSellerInputChange}
                required
              />
              <InputField
                key="state"
                label="Region / State"
                name="state"
                value={sellerData.state}
                onChange={handleSellerInputChange}
                required
              />
              <InputField
                key="zipCode"
                label="Postal Identifier"
                name="zipCode"
                value={sellerData.zipCode}
                onChange={handleSellerInputChange}
                required
              />
            </motion.div>

            {sellerData.sellerType === "company" && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5 }}
              >
                <InputField
                  key="businessRegNumber"
                  label="Corporate Registration ID"
                  name="businessRegNumber"
                  value={sellerData.businessRegNumber}
                  onChange={handleSellerInputChange}
                />
                <InputField
                  key="taxId"
                  label="Fiscal Tax Identifier"
                  name="taxId"
                  value={sellerData.taxId}
                  onChange={handleSellerInputChange}
                />
              </motion.div>
            )}

            <motion.div
              className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                <span>Financial Gateway Integration</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  key="bankAccountNumber"
                  label="Account Number"
                  name="bankAccountNumber"
                  value={sellerData.bankAccountNumber}
                  onChange={handleSellerInputChange}
                />
                <InputField
                  key="bankName"
                  label="Institution Name"
                  name="bankName"
                  value={sellerData.bankName}
                  onChange={handleSellerInputChange}
                />
                <InputField
                  key="ifscCode"
                  label="Swift / Routing Code"
                  name="ifscCode"
                  value={sellerData.ifscCode}
                  onChange={handleSellerInputChange}
                />
                <SelectField
                  key="paymentTerms"
                  label="Settlement Cycle"
                  name="paymentTerms"
                  value={sellerData.paymentTerms}
                  onChange={handleSellerInputChange}
                >
                  <option value="immediate">Instant Settlement</option>
                  <option value="7days">Net 7 Days</option>
                  <option value="15days">Net 15 Days</option>
                  <option value="30days">Net 30 Days</option>
                </SelectField>
              </div>
            </motion.div>

            <motion.div
              className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                <File className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                <span>Risk Management Protocols</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  key="cancellationPolicy"
                  label="Cancellation Framework"
                  name="cancellationPolicy"
                  value={sellerData.cancellationPolicy}
                  onChange={handleSellerInputChange}
                  type="textarea"
                  placeholder="Define escalation procedures and refund matrices..."
                />
                <InputField
                  key="damagePolicy"
                  label="Liability Assessment Model"
                  name="damagePolicy"
                  value={sellerData.damagePolicy}
                  onChange={handleSellerInputChange}
                  type="textarea"
                  placeholder="Quantify remediation costs and accountability chains..."
                />
                <InputField
                  key="insurancePolicy"
                  label="Coverage & Indemnity Scope"
                  name="insurancePolicy"
                  value={sellerData.insurancePolicy}
                  onChange={handleSellerInputChange}
                  type="textarea"
                  placeholder="Specify actuarial limits and carrier endorsements..."
                />
              </div>
            </motion.div>

            <FileInput
              key="documentFiles"
              label="Compliance Documentation Upload"
              onChange={handleDocumentChange}
              accept=".pdf,.jpg,.jpeg,.png"
              maxFiles={5}
            />
            <motion.p
              className="text-xs text-gray-500 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Regulatory filings, executive IDs, fiscal proofs (Max 5 files, 10MB each)
            </motion.p>

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-emerald-200/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Activate Equipment Catalog
            </motion.button>
          </form>
        </motion.div>
      );
    }
    
    // Step 4 rendering and the rest of the component remains the same...
    if (step === 4) {
        if (submissionSuccess) {
            return (
                <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 space-y-6"
                >
                    <motion.div
                        className="mx-auto bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-3xl h-32 w-32 flex items-center justify-center shadow-2xl mb-6"
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <CheckCircle className="h-16 w-16 text-white" />
                    </motion.div>
                    <motion.h3
                        className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700 bg-clip-text text-transparent mb-3"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Enterprise Onboarding Complete!
                    </motion.h3>
                    <motion.p
                        className="text-xl text-gray-600 mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Your profile and asset portfolio are now live in our ecosystem.
                    </motion.p>
                    <motion.p
                        className="text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        AI review underway. Dashboard access in moments...
                    </motion.p>
                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <motion.div
                            className="w-12 h-12 border-4 border-emerald-200 border-t-gradient-to-r from-emerald-500 to-purple-600 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    </motion.div>
                </motion.div>
            );
        }

        return (
            <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="flex items-center space-x-3 mb-6"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Package className="w-7 h-7 text-gradient-to-r from-emerald-600 via-blue-600 to-purple-600" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-gray-800">Asset Portfolio Configuration</h3>
                </motion.div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        initial="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                        }}
                        animate="visible"
                        transition={{ staggerChildren: 0.1 }}
                    >
                        <motion.div className="md:col-span-2">
                           {/* FIX 5: Added key props to all remaining fields */}
                            <InputField
                                key="title"
                                label="Asset Designation"
                                name="title"
                                value={equipmentData.title}
                                onChange={handleEquipmentInputChange}
                                placeholder="e.g., Precision CNC Machining Center - Haas VF-2"
                                required
                            />
                        </motion.div>
                        <SelectField
                            key="category"
                            label="Industry Sector"
                            name="category"
                            value={equipmentData.category}
                            onChange={handleEquipmentInputChange}
                            required
                        >
                            <option value="">Select Sector</option>
                            <option value="camera">Media Production Assets</option>
                            <option value="heavy-machinery">Infrastructure Deployment Gear</option>
                            <option value="power-tools">Fabrication Toolkit</option>
                            <option value="electronics">Automation Modules</option>
                            <option value="construction">Site Optimization Equipment</option>
                            <option value="other">Bespoke Industrial Solutions</option>
                        </SelectField>
                        <InputField
                            key="brand"
                            label="Manufacturer Brand"
                            name="brand"
                            value={equipmentData.brand}
                            onChange={handleEquipmentInputChange}
                            required
                        />
                        <InputField
                            key="model"
                            label="Model Specification"
                            name="model"
                            value={equipmentData.model}
                            onChange={handleEquipmentInputChange}
                            required
                        />
                        <SelectField
                            key="condition"
                            label="Operational Status"
                            name="condition"
                            value={equipmentData.condition}
                            onChange={handleEquipmentInputChange}
                        >
                            <option value="New">Factory Fresh - Uncommissioned</option>
                            <option value="Like New">Near-Mint - Low Cycle</option>
                            <option value="Used">Operational - Proven</option>
                            <option value="Well-Maintained">Serviced - Certified</option>
                            <option value="Refurbished">Revitalized - Warranted</option>
                        </SelectField>
                    </motion.div>

                    <InputField
                        key="description"
                        label="Comprehensive Asset Narrative"
                        name="description"
                        value={equipmentData.description}
                        onChange={handleEquipmentInputChange}
                        type="textarea"
                        rows={5}
                        placeholder="Elucidate capabilities, synergies, and ROI propositions for discerning procurement teams..."
                        required
                    />

                    <InputField
                        key="specifications"
                        label="Engineering Parameters"
                        name="specifications"
                        value={equipmentData.specifications}
                        onChange={handleEquipmentInputChange}
                        type="textarea"
                        rows={4}
                        placeholder="Delineate tolerances, throughput, interoperability, and scalability metrics..."
                    />

                    <motion.div
                        className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                            <CreditCard className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                            <span>Monetization & Deployment Strategy</span>
                        </h4>
                        <RadioGroup
                            name="availableFor"
                            value={equipmentData.availableFor}
                            onChange={handleEquipmentInputChange}
                            options={[
                                { value: "sale", label: "Outright Acquisition", desc: "Capital expenditure model" },
                                { value: "rent", label: "Subscription Leasing", desc: "OpEx recurring revenue" },
                                { value: "both", label: "Hybrid Flexibility", desc: "Adaptive procurement paths" }
                            ]}
                            title="Transaction Modality"
                        />
                        {(equipmentData.availableFor === "sale" || equipmentData.availableFor === "both") && (
                            <InputField
                                key="salePrice"
                                label="Acquisition Valuation (₹)"
                                name="salePrice"
                                value={equipmentData.salePrice}
                                onChange={handleEquipmentInputChange}
                                type="number"
                                placeholder="Benchmarked against market comparables"
                                required
                            />
                        )}
                        {(equipmentData.availableFor === "rent" || equipmentData.availableFor === "both") && (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <InputField
                                    key="rentalPricePerDay"
                                    label="Diurnal Leasing Rate (₹)"
                                    name="rentalPricePerDay"
                                    value={equipmentData.rentalPricePerDay}
                                    onChange={handleEquipmentInputChange}
                                    type="number"
                                />
                                <InputField
                                    key="rentalPricePerWeek"
                                    label="Weekly Engagement Fee (₹)"
                                    name="rentalPricePerWeek"
                                    value={equipmentData.rentalPricePerWeek}
                                    onChange={handleEquipmentInputChange}
                                    type="number"
                                />
                                <InputField
                                    key="rentalPricePerMonth"
                                    label="Lunar Cycle Pricing (₹)"
                                    name="rentalPricePerMonth"
                                    value={equipmentData.rentalPricePerMonth}
                                    onChange={handleEquipmentInputChange}
                                    type="number"
                                />
                                <InputField
                                    key="securityDeposit"
                                    label="Collateral Requirement (₹)"
                                    name="securityDeposit"
                                    value={equipmentData.securityDeposit}
                                    onChange={handleEquipmentInputChange}
                                    type="number"
                                />
                                <InputField
                                    key="leadTime"
                                    label="Mobilization Horizon"
                                    name="leadTime"
                                    value={equipmentData.leadTime}
                                    onChange={handleEquipmentInputChange}
                                    placeholder="e.g., 48-72 operational hours"
                                />
                            </motion.div>
                        )}
                    </motion.div>

                    <motion.div
                        className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                            <MapPin className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                            <span>Supply Chain Orchestration</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                key="deliveryOption"
                                label="Fulfillment Channels"
                                name="deliveryOption"
                                value={equipmentData.deliveryOption}
                                onChange={handleEquipmentInputChange}
                            >
                                <option value="pickup">Client Collection</option>
                                <option value="delivery">Managed Dispatch</option>
                                <option value="both">Omnichannel Availability</option>
                            </SelectField>
                            {(equipmentData.deliveryOption === "delivery" || equipmentData.deliveryOption === "both") && (
                                <InputField
                                    key="deliveryFee"
                                    label="Logistics Surcharge (₹)"
                                    name="deliveryFee"
                                    value={equipmentData.deliveryFee}
                                    onChange={handleEquipmentInputChange}
                                    type="number"
                                />
                            )}
                            <InputField
                                key="pickupLocation"
                                label="Fulfillment Origin"
                                name="pickupLocation"
                                value={equipmentData.pickupLocation}
                                onChange={handleEquipmentInputChange}
                                placeholder="Strategic distribution nexus"
                                required
                            />
                            <InputField
                                key="shippingWeight"
                                label="Freight Mass (kg)"
                                name="shippingWeight"
                                value={equipmentData.shippingWeight}
                                onChange={handleEquipmentInputChange}
                            />
                            <InputField
                                key="shippingDimensions"
                                label="Cubic Footprint (L x W x H cm)"
                                name="shippingDimensions"
                                value={equipmentData.shippingDimensions}
                                onChange={handleEquipmentInputChange}
                                placeholder="e.g., 300 x 150 x 200"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                            <Camera className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                            <span>Immersive Visual Asset Library</span>
                        </h4>
                        <FileInput
                            key="imageFiles"
                            label="High-Fidelity Imagery Upload"
                            onChange={handleImageChange}
                            accept="image/*"
                            maxFiles={10}
                            required
                        />
                        <motion.p
                            className="text-xs text-gray-500 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Multi-perspective, high-res captures (Max 10 assets, 5MB each)
                        </motion.p>
                        <AnimatePresence>
                            {imagePreviews.length > 0 && (
                                <motion.div
                                    className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {imagePreviews.map((preview, index) => (
                                        <motion.div
                                            key={index}
                                            className="relative overflow-hidden rounded-2xl shadow-lg group hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                            whileHover={{ scale: 1.05, rotateY: 5 }}
                                        >
                                            <motion.img
                                                src={preview}
                                                alt={`Asset perspective ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2"
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <span className="text-white text-xs font-medium">Perspective {index + 1}</span>
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div
                        className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                            <FileText className="w-6 h-6 text-gradient-to-r from-emerald-600 to-purple-600" />
                            <span>Governance & Assurance Matrix</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                key="usageGuidelines"
                                label="Operational Protocols & Safeguards"
                                name="usageGuidelines"
                                value={equipmentData.usageGuidelines}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={3}
                                placeholder="Mandate training regimens, interoperability audits, and contingency frameworks..."
                            />
                            <InputField
                                key="insuranceDetails"
                                label="Exposure & Mitigation Schema"
                                name="insuranceDetails"
                                value={equipmentData.insuranceDetails}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={3}
                                placeholder="Articulate actuarial safeguards, indemnity scopes, and reinsurance layers..."
                            />
                            <InputField
                                key="warrantyDetails"
                                label="Performance Assurance Clauses"
                                name="warrantyDetails"
                                value={equipmentData.warrantyDetails}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={2}
                                placeholder="Delineate uptime SLAs, remediation timelines, and escalation pathways..."
                            />
                            <InputField
                                key="maintenanceHistory"
                                label="Lifecycle Management Ledger"
                                name="maintenanceHistory"
                                value={equipmentData.maintenanceHistory}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={3}
                                placeholder="Chronicle calibration cycles, overhaul intervals, and predictive diagnostics..."
                            />
                            <InputField
                                key="certifications"
                                label="Conformance & Accreditation Dossier"
                                name="certifications"
                                value={equipmentData.certifications}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={2}
                                placeholder="Enumerate ISO alignments, regulatory endorsements, and sector validations..."
                            />
                            <InputField
                                key="termsAndConditions"
                                label="Engagement Covenant Provisions"
                                name="termsAndConditions"
                                value={equipmentData.termsAndConditions}
                                onChange={handleEquipmentInputChange}
                                type="textarea"
                                rows={4}
                                placeholder="Codify dispute arbitration, termination triggers, and jurisdictional stipulations..."
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-8 rounded-3xl border border-emerald-100 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="flex items-start space-x-4">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Shield className="w-8 h-8 text-gradient-to-r from-emerald-600 to-purple-600 flex-shrink-0" />
                            </motion.div>
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-gray-800 mb-3">AI-Augmented Compliance Horizon</h4>
                                <p className="text-gray-700 leading-relaxed">Leveraging generative AI for predictive validation, your submission traverses our neural governance lattice—ensuring ISO 27001 fidelity and instantaneous market activation within 24 orbits.</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.button
                        type="submit"
                        disabled={isLoading || submissionSuccess}
                        className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white font-bold py-5 px-6 rounded-2xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-3xl text-lg relative overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.span
                                    key="loading"
                                    className="flex items-center justify-center space-x-2"
                                >
                                    <motion.div
                                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span>{loadingMessage}</span>
                                </motion.span>
                            ) : (
                                <motion.span key="submit">Propel to AI Review & Ecosystem Integration</motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </form>
            </motion.div>
        );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-purple-50 py-12 px-4 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent)]"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02, rotateX: 5 }}
          >
            Shramic Equipment
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Equipment Rentals and Selling | 2025 Compliant
          </motion.p>
        </motion.div>

        {renderStepIndicator()}

        <motion.div
          className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 border border-gray-100/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-8 bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 border-l-4 border-red-400 p-5 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
          
          <div ref={recaptchaContainerRef} className="sr-only" />
        </motion.div>

        <motion.div
          className="text-center mt-12 text-sm text-gray-500 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Elite Concierge | <a href="mailto:nexus@shramic.com" className="text-gradient-to-r from-emerald-600 to-purple-600 hover:underline font-medium">nexus@shramic.com</a></p>
          <p className="text-xs">© 2025 Shramic Networks Pvt Lmt. | AI-Governed under ISO 42001 & GDPR Fusion</p>
        </motion.div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}