"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { 
  UserSettings, 
  DEFAULT_USER_SETTINGS, 
  ThemePreference, 
  DefaultDashboardPreference,
  TimeFormatPreference
} from "@/types/settings";
import { getUserSettings, saveUserSettings, applyTheme, applyAccessibility } from "@/lib/services/user-settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  User as UserIcon, 
  Shield, 
  Bell, 
  SunMoon, 
  Lock, 
  Sliders, 
  Check, 
  AlertTriangle, 
  LogOut, 
  Eye, 
  EyeOff, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Globe, 
  Clock, 
  Layout, 
  Sparkles,
  Smartphone,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

type SettingsTab = "account" | "security" | "notifications" | "appearance" | "privacy" | "application";

export default function SettingsPage() {
  const { currentUser, firebaseUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => ({
    userId: "",
    ...DEFAULT_USER_SETTINGS,
    updatedAt: 0
  }));

  // Account Profile Form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Load Settings & User Document
  useEffect(() => {
    async function loadData() {
      if (!currentUser || !firebaseUser) {
        setLoading(false);
        return;
      }

      setDisplayName(currentUser.displayName || firebaseUser.displayName || "");
      
      // Load Firestore user doc for bio & phone
      try {
        const uDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (uDoc.exists()) {
          const udata = uDoc.data();
          setBio(udata.bio || "");
          setPhone(udata.phone || "");
        }
      } catch (err) {
        console.warn("Could not load extended profile details:", err);
      }

      // Load Settings
      try {
        const loadedSettings = await getUserSettings(currentUser.uid);
        setSettings(loadedSettings);
        applyTheme(loadedSettings.theme);
        applyAccessibility(loadedSettings.compactMode, loadedSettings.reducedMotion);
      } catch (err) {
        console.warn("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, firebaseUser]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !firebaseUser) return;
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(firebaseUser, {
        displayName: displayName.trim()
      });

      // 2. Update Firestore User Document (only non-protected fields)
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        updatedAt: Date.now()
      });

      // If student profile exists, update student doc
      if (currentUser.role === "STUDENT") {
        try {
          const sRef = doc(db, "studentProfiles", currentUser.uid);
          await setDoc(sRef, { updatedAt: Date.now() }, { merge: true });
        } catch {
          // Ignore
        }
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!firebaseUser || !firebaseUser.email) return;

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      // 1. Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // 2. Update password
      await updatePassword(firebaseUser, newPassword);

      setPasswordSuccess("Password changed successfully!");
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("The current password you entered is incorrect.");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("This operation is sensitive. Please sign out and sign back in before retrying.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Settings State Change
  const updateSettingState = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    if (key === "theme") {
      applyTheme(value as ThemePreference);
    }
    if (key === "compactMode" || key === "reducedMotion") {
      applyAccessibility(
        key === "compactMode" ? (value as boolean) : settings.compactMode,
        key === "reducedMotion" ? (value as boolean) : settings.reducedMotion
      );
    }
  };

  // Handle Notification Toggle
  const toggleNotification = (key: keyof UserSettings["notifications"]) => {
    const updated = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    };
    setSettings(updated);
  };

  // Handle Privacy Toggle
  const togglePrivacy = (key: keyof UserSettings["privacy"]) => {
    const updated = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key]
      }
    };
    setSettings(updated);
  };

  // Persist Settings
  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setSavingSettings(true);
    try {
      await saveUserSettings(currentUser.uid, settings);
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (err: any) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out");
    }
  };

  const copyUidToClipboard = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
      toast.success("UID copied to clipboard");
    }
  };

  // Detect OAuth Provider
  const isPasswordProvider = firebaseUser?.providerData.some(p => p.providerId === "password");

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-[#5B5F73]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#9C7A4C]" />
        <p className="text-sm font-medium">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">Settings</h1>
        <p className="text-[#5B5F73]">
          Manage your personal account, security preferences, notifications, and application experience.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#9C7A4C]/20 pb-4">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "account"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <UserIcon className="w-4 h-4" /> Account
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "security"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <Shield className="w-4 h-4" /> Security
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "notifications"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "appearance"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <SunMoon className="w-4 h-4" /> Appearance
        </button>

        <button
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "privacy"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <Lock className="w-4 h-4" /> Privacy
        </button>

        <button
          onClick={() => setActiveTab("application")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "application"
              ? "bg-[#9C7A4C] text-white shadow-sm"
              : "text-[#5B5F73] hover:bg-[#EFEDE8] hover:text-[#1C1C1E]"
          }`}
        >
          <Sliders className="w-4 h-4" /> Application
        </button>
      </div>

      {/* 1. ACCOUNT SETTINGS */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1C1C1E]">Profile Information</CardTitle>
              <CardDescription>
                Update your public name, contact information, and biography across SynergyBridge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                    Bio / Headline
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                    placeholder="e.g. AI Researcher & Agriculture Innovator passionate about edge computer vision."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                    </>
                  ) : (
                    "Save Profile Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Protected System Attributes Card */}
          <Card className="border-[#9C7A4C]/20 bg-[#EFEDE8]/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-[#1C1C1E] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#9C7A4C]" /> System-Enforced Attributes (Protected)
              </CardTitle>
              <CardDescription>
                These authoritative attributes are governed by institutional enrollment and platform RBAC rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white rounded-lg border border-[#9C7A4C]/20">
                  <span className="text-xs text-[#5B5F73] font-semibold uppercase">User Role</span>
                  <div className="font-bold text-[#1C1C1E] mt-0.5">{currentUser?.role || "STUDENT"}</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#9C7A4C]/20">
                  <span className="text-xs text-[#5B5F73] font-semibold uppercase">Account Status</span>
                  <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {currentUser?.accountStatus || "ACTIVE"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#9C7A4C]/20">
                  <span className="text-xs text-[#5B5F73] font-semibold uppercase">Institution ID</span>
                  <div className="font-bold text-[#1C1C1E] mt-0.5 truncate" title={currentUser?.institutionId}>
                    {currentUser?.institutionId || "synergybridge-demo-institute"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#9C7A4C]/20 sm:col-span-2 md:col-span-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#5B5F73] font-semibold uppercase">Authenticated UID</span>
                    <div className="font-mono text-xs text-[#1C1C1E] mt-0.5">{currentUser?.uid}</div>
                  </div>
                  <button
                    onClick={copyUidToClipboard}
                    className="p-2 text-[#5B5F73] hover:text-[#1C1C1E] hover:bg-[#EFEDE8] rounded-md transition-colors"
                    title="Copy UID"
                  >
                    {copiedUid ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. SECURITY SETTINGS */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1C1C1E]">Password & Authentication</CardTitle>
              <CardDescription>
                Ensure your SynergyBridge account is protected with a secure password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPasswordProvider ? (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 pr-10 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B5F73] hover:text-[#1C1C1E]"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                      New Password (min. 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 pr-10 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B5F73] hover:text-[#1C1C1E]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="p-4 bg-[#EFEDE8] rounded-lg border border-[#5B5F73]/20">
                  <p className="text-sm text-[#1C1C1E] font-medium">
                    You signed in using a federated social provider (e.g. Google OAuth).
                  </p>
                  <p className="text-xs text-[#5B5F73] mt-1">
                    Password management is handled directly through your provider&apos;s security center.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Session Info Card */}
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1C1C1E]">Active Session Information</CardTitle>
              <CardDescription>
                Details of your authenticated session on this browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#9C7A4C]/10">
                  <span className="text-[#5B5F73]">Signed-in Email</span>
                  <span className="font-semibold text-[#1C1C1E]">{firebaseUser?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#9C7A4C]/10">
                  <span className="text-[#5B5F73]">Authentication Method</span>
                  <span className="font-semibold text-[#1C1C1E] uppercase">{firebaseUser?.providerData[0]?.providerId || "password"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#9C7A4C]/10">
                  <span className="text-[#5B5F73]">Email Verified</span>
                  <span className="font-semibold text-emerald-700">{firebaseUser?.emailVerified ? "Yes" : "Verified via Demo"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5B5F73]">Session Status</span>
                  <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" /> Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Card */}
          <Card className="border-red-200 bg-red-50/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-red-700">Account Session Management</CardTitle>
              <CardDescription>
                Sign out of your active session on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out of SynergyBridge
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. NOTIFICATION SETTINGS */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#1C1C1E]">Notification Preferences</CardTitle>
                <CardDescription>
                  Choose the activity updates you want to receive across project workspaces.
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider">Project & Collaboration</h3>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Project Milestone Updates</div>
                    <div className="text-xs text-[#5B5F73]">Alerts when milestones are reached, approved, or rescheduled.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.projectUpdates}
                    onChange={() => toggleNotification("projectUpdates")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Task Assignments & Kanban Moves</div>
                    <div className="text-xs text-[#5B5F73]">Notifications when a teammate assigns or moves tasks you own.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.taskAssignments}
                    onChange={() => toggleNotification("taskAssignments")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Upcoming Deadlines & Reminders</div>
                    <div className="text-xs text-[#5B5F73]">Reminders 48 hours before milestone and evaluation targets.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.deadlines}
                    onChange={() => toggleNotification("deadlines")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Chat & Workspace Messages</div>
                    <div className="text-xs text-[#5B5F73]">Direct mentions and team messages in your project workspace.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.messages}
                    onChange={() => toggleNotification("messages")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Mentor Guidance & Reviews</div>
                    <div className="text-xs text-[#5B5F73]">Feedback, advice, and session requests from assigned mentors.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.mentorUpdates}
                    onChange={() => toggleNotification("mentorUpdates")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider">Opportunities & Impact</h3>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Problem Application Status</div>
                    <div className="text-xs text-[#5B5F73]">Shortlists, approvals, and team invitations for challenge problems.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.applicationUpdates}
                    onChange={() => toggleNotification("applicationUpdates")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Milestone Grant & Funding Alerts</div>
                    <div className="text-xs text-[#5B5F73]">Notifications regarding tranche approvals and grant disbursements.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.fundingUpdates}
                    onChange={() => toggleNotification("fundingUpdates")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Certificate Issuance & Credentials</div>
                    <div className="text-xs text-[#5B5F73]">Alerts when completion certificates and ABC credits are published.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.certificateUpdates}
                    onChange={() => toggleNotification("certificateUpdates")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Achievements & Streak Celebrations</div>
                    <div className="text-xs text-[#5B5F73]">XP rewards, level-ups, and leaderboard progression milestones.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.achievements}
                    onChange={() => toggleNotification("achievements")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-4 pt-4 border-t border-[#9C7A4C]/10">
                <h3 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider">Delivery Channels</h3>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#9C7A4C]" />
                    <div>
                      <div className="font-semibold text-sm text-[#1C1C1E]">In-App Notifications</div>
                      <div className="text-xs text-[#5B5F73]">Real-time toasts and notification bell feed in header.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.inApp}
                    onChange={() => toggleNotification("inApp")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#9C7A4C]" />
                    <div>
                      <div className="font-semibold text-sm text-[#1C1C1E]">Email Notification Digests</div>
                      <div className="text-xs text-[#5B5F73]">Weekly summary digest sent to your registered email.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={() => toggleNotification("email")}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. APPEARANCE SETTINGS */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#1C1C1E]">Theme & Visual Style</CardTitle>
                <CardDescription>
                  Customize the interface theme to suit your viewing preference.
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Appearance
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-3">
                  Color Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                  <button
                    type="button"
                    onClick={() => updateSettingState("theme", "system")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.theme === "system"
                        ? "border-[#9C7A4C] ring-2 ring-[#9C7A4C]/30 bg-[#EFEDE8]/50"
                        : "border-[#5B5F73]/20 hover:border-[#9C7A4C]/40 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className="w-5 h-5 text-[#9C7A4C]" />
                      {settings.theme === "system" && <Check className="w-4 h-4 text-[#9C7A4C]" />}
                    </div>
                    <div className="font-bold text-sm text-[#1C1C1E]">System Default</div>
                    <div className="text-xs text-[#5B5F73] mt-1">Matches your OS color scheme.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettingState("theme", "light")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.theme === "light"
                        ? "border-[#9C7A4C] ring-2 ring-[#9C7A4C]/30 bg-[#EFEDE8]/50"
                        : "border-[#5B5F73]/20 hover:border-[#9C7A4C]/40 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <SunMoon className="w-5 h-5 text-[#9C7A4C]" />
                      {settings.theme === "light" && <Check className="w-4 h-4 text-[#9C7A4C]" />}
                    </div>
                    <div className="font-bold text-sm text-[#1C1C1E]">Light Mode</div>
                    <div className="text-xs text-[#5B5F73] mt-1">High-contrast bright canvas.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettingState("theme", "dark")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.theme === "dark"
                        ? "border-[#9C7A4C] ring-2 ring-[#9C7A4C]/30 bg-[#EFEDE8]/50"
                        : "border-[#5B5F73]/20 hover:border-[#9C7A4C]/40 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <SunMoon className="w-5 h-5 text-[#9C7A4C]" />
                      {settings.theme === "dark" && <Check className="w-4 h-4 text-[#9C7A4C]" />}
                    </div>
                    <div className="font-bold text-sm text-[#1C1C1E]">Dark Mode</div>
                    <div className="text-xs text-[#5B5F73] mt-1">Comfortable low-glare tone.</div>
                  </button>
                </div>
              </div>

              {/* Accessibility Controls */}
              <div className="space-y-4 pt-4 border-t border-[#9C7A4C]/10">
                <h3 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider">Display & Accessibility</h3>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Compact Layout Mode</div>
                    <div className="text-xs text-[#5B5F73]">Reduces padding and table row spacing to show more content per screen.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSettingState("compactMode", e.target.checked)}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white">
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E]">Reduced Motion</div>
                    <div className="text-xs text-[#5B5F73]">Disables decorative transitions and micro-animations for smoother rendering.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => updateSettingState("reducedMotion", e.target.checked)}
                    className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. PRIVACY SETTINGS */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#1C1C1E]">Profile Visibility & Privacy</CardTitle>
                <CardDescription>
                  Control how your skills, portfolio, and identity are discovered across teams.
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Privacy
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm text-[#1C1C1E]">Visible to Assigned Mentors</div>
                  <div className="text-xs text-[#5B5F73]">Allow verified mentors to view your problem match history and learning path.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.visibleToMentors}
                  onChange={() => togglePrivacy("visibleToMentors")}
                  className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm text-[#1C1C1E]">Visible to Project Teammates</div>
                  <div className="text-xs text-[#5B5F73]">Display contact details and collaborative tasks to accepted teammates.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.visibleToTeammates}
                  onChange={() => togglePrivacy("visibleToTeammates")}
                  className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm text-[#1C1C1E]">Display Skills on Platform Leaderboard</div>
                  <div className="text-xs text-[#5B5F73]">Highlight your verified proficiency badges on leaderboard rankings.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showSkills}
                  onChange={() => togglePrivacy("showSkills")}
                  className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#9C7A4C]/10 bg-white hover:bg-[#EFEDE8]/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm text-[#1C1C1E]">Allow Institutional & Recruiter Discovery</div>
                  <div className="text-xs text-[#5B5F73]">Allow faculty coordinators to match your profile with relevant challenges.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.allowDiscovery}
                  onChange={() => togglePrivacy("allowDiscovery")}
                  className="w-4 h-4 accent-[#9C7A4C] cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. APPLICATION SETTINGS */}
      {activeTab === "application" && (
        <div className="space-y-6">
          <Card className="border-[#9C7A4C]/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#1C1C1E]">Application Preferences</CardTitle>
                <CardDescription>
                  Configure your default dashboard view, time format, and timezone.
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-[#9C7A4C]" /> Default Dashboard Landing Page
                </label>
                <select
                  value={settings.application.defaultDashboard}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      application: {
                        ...settings.application,
                        defaultDashboard: e.target.value as DefaultDashboardPreference
                      }
                    };
                    setSettings(updated);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] bg-white text-[#1C1C1E]"
                >
                  <option value="overview">Dashboard Overview (/dashboard)</option>
                  <option value="problems">Explore Problems (/explore/problems)</option>
                  <option value="projects">Active Projects (/dashboard/projects)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#9C7A4C]" /> Time Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#1C1C1E] cursor-pointer">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="12h"
                      checked={settings.application.timeFormat === "12h"}
                      onChange={() => {
                        const updated = {
                          ...settings,
                          application: { ...settings.application, timeFormat: "12h" as TimeFormatPreference }
                        };
                        setSettings(updated);
                      }}
                      className="accent-[#9C7A4C]"
                    />
                    12-Hour (1:30 PM)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#1C1C1E] cursor-pointer">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="24h"
                      checked={settings.application.timeFormat === "24h"}
                      onChange={() => {
                        const updated = {
                          ...settings,
                          application: { ...settings.application, timeFormat: "24h" as TimeFormatPreference }
                        };
                        setSettings(updated);
                      }}
                      className="accent-[#9C7A4C]"
                    />
                    24-Hour (13:30)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#9C7A4C]" /> Timezone
                </label>
                <input
                  type="text"
                  value={settings.application.timezone}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      application: { ...settings.application, timezone: e.target.value }
                    };
                    setSettings(updated);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#9C7A4C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E]"
                  placeholder="e.g. Asia/Kolkata or UTC"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
