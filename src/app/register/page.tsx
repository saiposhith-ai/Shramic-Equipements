"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, User } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Upload, CheckCircle, Phone, MapPin, Package, FileText, AlertCircle, Settings, DollarSign, Shield, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
const storage = getStorage(app);

const categories = {
  "Construction": ["Excavator", "Loader", "Crane", "Concrete Mixer", "Bulldozer", "Compactor", "Grader"],
  "Agriculture": ["Tractor", "Harvester", "Thresher", "Rotavator", "Seeder", "Sprayer", "Plough"],
  "Tools": ["Generator", "Welding Machine", "Air Compressor", "Power Tools", "Hand Tools"],
  "Vehicles": ["Truck", "Trailer", "Pickup", "Tipper", "JCB"],
  "Others": ["Custom Equipment"]
};

export default function ShramicRegistration() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [listingId, setListingId] = useState("");
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [formData, setFormData] = useState({
    // Step 1: Equipment Type
    category: "",
    subCategory: "",
    usageType: "",
    
    // Step 2: Basic Info
    brand: "",
    modelName: "",
    yearOfManufacture: "",
    equipmentTitle: "",
    description: "",
    
    // Step 3: Technical Specs
    enginePower: "",
    bucketCapacity: "",
    operatingWeight: "",
    fuelType: "",
    attachmentsIncluded: false,
    attachmentsList: "",
    driveType: "",
    implementOptions: "",
    
    // Step 4: Condition
    workingCondition: "",
    operatingHours: "",
    lastServicedDate: "",
    insuranceStatus: "",
    
    // Step 5: Location
    state: "",
    district: "",
    city: "",
    pincode: "",
    googleMapPin: "",
    deliveryOption: "",
    transportationCharges: "",
    
    // Step 6: Pricing
    rentalPricePerHour: "",
    rentalPricePerDay: "",
    rentalPricePerWeek: "",
    rentalPricePerMonth: "",
    minRentalDuration: "",
    minRentalDurationUnit: "day",
    securityDeposit: "",
    operatorIncluded: false,
    sellingPrice: "",
    negotiable: false,
    
    // Step 8: Owner Info
    ownerName: "",
    companyName: "",
    email: "",
    gstPan: "",
    address: "",
    
    // Step 9: Terms
    rentalTerms: "",
    cancellationPolicy: "",
    digitalConsent: false
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);

  useEffect(() => {
    if (recaptchaContainerRef.current && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          { size: 'invisible' }
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
      let cleanedNumber = phoneNumber.replace(/[\s\-()]/g, '');
      if (!cleanedNumber.startsWith('+')) {
        cleanedNumber = cleanedNumber.length === 10 ? `+91${cleanedNumber}` : `+${cleanedNumber}`;
      }
      const result = await signInWithPhoneNumber(auth, cleanedNumber, window.recaptchaVerifier!);
      setConfirmationResult(result);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await confirmationResult!.confirm(otp);
      setUser(result.user);
      setStep(3);
    } catch (err: any) {
      setError("Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImageFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setDocumentFiles(files);
      setDocumentNames(files.map(f => f.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setLoadingMessage("Uploading images...");

    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `equipments/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }

      setLoadingMessage("Uploading video...");
      let videoUrl = "";
      if (videoFile) {
        const videoRef = ref(storage, `videos/${user.uid}/${Date.now()}_${videoFile.name}`);
        const snapshot = await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(snapshot.ref);
      }

      setLoadingMessage("Uploading documents...");
      const documentUrls: string[] = [];
      for (const file of documentFiles) {
        const docRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(docRef, file);
        const url = await getDownloadURL(snapshot.ref);
        documentUrls.push(url);
      }

      setLoadingMessage("Finalizing registration...");
      const docRef = await addDoc(collection(db, "equipments"), {
        ...formData,
        imageUrls,
        videoUrl,
        documentUrls,
        ownerPhoneNumber: user.phoneNumber,
        ownerUid: user.uid,
        status: "under_review",
        createdAt: new Date(),
      });

      setListingId(docRef.id);
      setSubmissionSuccess(true);
    } catch (err: any) {
      console.error("Error:", err);
      setError("Failed to submit listing");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 10 && <div className={`w-6 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    // Phone Verification
    if (step === 1) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="text-center space-y-2">
            <Phone className="w-12 h-12 mx-auto text-emerald-600" />
            <h3 className="text-2xl font-bold text-gray-800">Verify Your Mobile Number</h3>
            <p className="text-gray-600">We'll send you a 6-digit verification code</p>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="bg-emerald-50 p-6 rounded-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        </motion.div>
      );
    }

    // OTP Verification
    if (step === 2) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Enter Verification Code</h3>
            <p className="text-gray-600">Code sent to {phoneNumber}</p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp(''); }}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Change Phone Number
            </button>
          </form>
        </motion.div>
      );
    }

    // Step 3: Equipment Type & Category
    if (step === 3) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-8 h-8 text-emerald-600" />
            <h3 className="text-2xl font-bold text-gray-800">Equipment Type & Category</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category *</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.category}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">Select Sub-Category</option>
                  {formData.category && categories[formData.category as keyof typeof categories].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Usage Type *</label>
              <div className="grid grid-cols-3 gap-4">
                {['rent', 'sale', 'both'].map(type => (
                  <label key={type} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="usageType"
                      value={type}
                      checked={formData.usageType === type}
                      onChange={handleInputChange}
                      className="peer sr-only"
                      required
                    />
                    <div className="p-4 border-2 border-gray-200 rounded-xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 text-center transition-all">
                      <span className="font-medium capitalize">{type === 'both' ? 'Rent & Sale' : `For ${type}`}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700"
            >
              Continue to Basic Information
            </button>
          </form>
        </motion.div>
      );
    }

    // Step 4: Basic Information
    if (step === 4) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Basic Information</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(5); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., JCB, Mahindra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model Name/Number *</label>
                <input
                  type="text"
                  name="modelName"
                  value={formData.modelName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 3DX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Manufacture *</label>
                <input
                  type="number"
                  name="yearOfManufacture"
                  value={formData.yearOfManufacture}
                  onChange={handleInputChange}
                  required
                  min="1950"
                  max="2025"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Title *</label>
              <input
                type="text"
                name="equipmentTitle"
                value={formData.equipmentTitle}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., JCB 3DX Backhoe Loader - Good Condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Describe the equipment features, condition, and any additional details..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700"
              >
                Continue to Specifications
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 5: Technical Specifications
    if (step === 5) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-8 h-8 text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-800">Technical Specifications</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(6); }} className="space-y-6">
            {(formData.category === "Construction" || formData.category === "Agriculture") && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engine Power (HP)</label>
                  <input
                    type="number"
                    name="enginePower"
                    value={formData.enginePower}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                {formData.category === "Construction" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bucket Capacity</label>
                      <input
                        type="text"
                        name="bucketCapacity"
                        value={formData.bucketCapacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g., 1.0 cum"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Operating Weight</label>
                      <input
                        type="text"
                        name="operatingWeight"
                        value={formData.operatingWeight}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g., 7500 kg"
                      />
                    </div>
                  </>
                )}
                {formData.category === "Agriculture" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drive Type</label>
                    <select
                      name="driveType"
                      value={formData.driveType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Select Drive Type</option>
                      <option value="2WD">2WD</option>
                      <option value="4WD">4WD</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="attachmentsIncluded"
                  checked={formData.attachmentsIncluded}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Attachments/Implements Included</span>
              </label>
              {formData.attachmentsIncluded && (
                <textarea
                  name="attachmentsList"
                  value={formData.attachmentsList}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="List all attachments/implements included..."
                />
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700"
              >
                Continue to Condition
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 6: Condition & Documentation
    if (step === 6) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
            <h3 className="text-2xl font-bold text-gray-800">Condition & Documentation</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(7); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Condition *</label>
                <select
                  name="workingCondition"
                  value={formData.workingCondition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Select Condition</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Repair">Needs Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours (approx.)</label>
                <input
                  type="number"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Serviced Date</label>
                <input
                  type="date"
                  name="lastServicedDate"
                  value={formData.lastServicedDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Status</label>
                <select
                  name="insuranceStatus"
                  value={formData.insuranceStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents (Certificates, Fitness, Permits, Service Records)</label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-gray-500 mt-1">Optional but recommended for trust • Multiple files allowed</p>
              {documentNames.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">{documentNames.length} file(s) selected:</p>
                  <div className="space-y-2">
                    {documentNames.map((name, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-orange-50 p-2 rounded-lg">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-700 truncate flex-1">{name}</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700"
              >
                Continue to Location
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 7: Location & Logistics
    if (step === 7) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-bold text-gray-800">Location & Logistics</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(8); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City/Village *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Map Pin (Optional)</label>
              <input
                type="url"
                name="googleMapPin"
                value={formData.googleMapPin}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Paste Google Maps link"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Option *</label>
                <select
                  name="deliveryOption"
                  value={formData.deliveryOption}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">Select Option</option>
                  <option value="Pickup">Pickup Only</option>
                  <option value="Owner Delivery">Owner Will Deliver</option>
                  <option value="Third-party">Third-party Transport Available</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transportation Charges (₹)</label>
                <input
                  type="number"
                  name="transportationCharges"
                  value={formData.transportationCharges}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="If applicable"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700"
              >
                Continue to Pricing
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 8: Pricing & Availability
    if (step === 8) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-800">Pricing & Availability</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(9); }} className="space-y-6">
            {(formData.usageType === 'rent' || formData.usageType === 'both') && (
              <div className="bg-green-50 p-6 rounded-2xl space-y-6">
                <h4 className="font-semibold text-lg text-gray-800">Rental Pricing</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Hour (₹)</label>
                    <input
                      type="number"
                      name="rentalPricePerHour"
                      value={formData.rentalPricePerHour}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (₹)</label>
                    <input
                      type="number"
                      name="rentalPricePerDay"
                      value={formData.rentalPricePerDay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Week (₹)</label>
                    <input
                      type="number"
                      name="rentalPricePerWeek"
                      value={formData.rentalPricePerWeek}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Month (₹)</label>
                    <input
                      type="number"
                      name="rentalPricePerMonth"
                      value={formData.rentalPricePerMonth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rental Duration</label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      name="minRentalDuration"
                      value={formData.minRentalDuration}
                      onChange={handleInputChange}
                      min="1"
                      className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter"
                    />
                    <select
                      name="minRentalDurationUnit"
                      value={formData.minRentalDurationUnit}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="hour">Hour(s)</option>
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                   <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="operatorIncluded"
                    checked={formData.operatorIncluded}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Operator Included</span>
                </label>
              </div>
            )}
            {(formData.usageType === 'sale' || formData.usageType === 'both') && (
              <div className="bg-blue-50 p-6 rounded-2xl space-y-6">
                <h4 className="font-semibold text-lg text-gray-800">Sale Pricing</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹) *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      required={formData.usageType === 'sale' || formData.usageType === 'both'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="negotiable"
                        checked={formData.negotiable}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Price Negotiable</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(7)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700"
              >
                Continue to Photos
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 9: Upload Photos & Video
    if (step === 9) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Camera className="w-8 h-8 text-pink-600" />
            <h3 className="text-2xl font-bold text-gray-800">Upload Photos & Video</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(10); }} className="space-y-6">
            <div className="bg-pink-50 p-6 rounded-2xl space-y-4">
              <h4 className="font-semibold text-gray-800">Photo Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Upload 6-10 clear photos</li>
                <li>Include: Front, Side, Back, Engine/Interior, Attachments</li>
                <li>Good lighting and multiple angles</li>
              </ul>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {imagePreviews.map((preview, idx) => (
                    <img
                      key={idx}
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl space-y-4">
              <h4 className="font-semibold text-gray-800">Video (Optional but Recommended)</h4>
              <p className="text-sm text-gray-600">10-30 second video showing working condition</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(8)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-pink-600 text-white font-semibold py-3 rounded-xl hover:bg-pink-700"
              >
                Continue to Owner Info
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Step 10: Owner Verification & Terms
    if (step === 10) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h3 className="text-2xl font-bold text-gray-800">Owner Information & Terms</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-indigo-50 p-6 rounded-2xl space-y-6">
              <h4 className="font-semibold text-lg text-gray-800">Owner Details</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company/Business Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST/PAN</label>
                  <input
                    type="text"
                    name="gstPan"
                    value={formData.gstPan}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-2xl space-y-4">
              <h4 className="font-semibold text-lg text-gray-800">Terms & Policies</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rental Terms / Damage Liability</label>
                <textarea
                  name="rentalTerms"
                  value={formData.rentalTerms}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                  placeholder="Describe terms for rental usage, damage policy, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                <textarea
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                  placeholder="Cancellation terms and refund policy"
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="digitalConsent"
                  checked={formData.digitalConsent}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 text-emerald-600 rounded mt-1"
                />
                <span className="text-sm text-gray-700">
                  <strong>I confirm that:</strong> All information provided is accurate and true. I understand that false information may result in listing rejection. I agree to Shramic's terms and conditions.
                </span>
              </label>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(9)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.digitalConsent}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? loadingMessage : "Submit Listing"}
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    return null;
  };

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto bg-emerald-100 rounded-full h-24 w-24 flex items-center justify-center"
          >
            <CheckCircle className="h-16 w-16 text-emerald-600" />
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-800">Listing Submitted Successfully!</h2>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <p className="text-sm text-gray-600 mb-2">Your Listing ID</p>
            <p className="text-2xl font-mono font-bold text-emerald-600">{listingId}</p>
          </div>
          <div className="space-y-3">
            <p className="text-lg text-gray-700">Your equipment listing is now <strong>under review</strong></p>
            <p className="text-gray-600">Our team will verify the details and approve your listing within <strong>24-48 hours</strong></p>
            <p className="text-sm text-gray-500">You'll receive a confirmation email at {formData.email}</p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Shramic Equipment
          </h1>
          <p className="text-gray-600">List Your Equipment for Rent or Sale</p>
        </motion.div>

        {step > 2 && renderStepIndicator()}

        <div className="bg-white rounded-3xl shadow-xl p-8">
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
                  <button
                    onClick={() => setError("")}
                    className="text-white hover:text-gray-200 ml-2"
                  >
                    ×
                  </button>
                </div>
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-white/30"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {renderStep()}
        </div>

        <div ref={recaptchaContainerRef} className="sr-only" />

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact us at <a href="mailto:support@shramic.com" className="text-emerald-600 hover:underline">support@shramic.com</a></p>
          <p className="text-xs mt-2">© 2025 Shramic Networks Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}