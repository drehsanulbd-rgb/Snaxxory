/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import { SYNC_FILE_NAME } from '../../services/googleDriveService';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  LogOut,
  ShieldCheck,
  HardDrive,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const GoogleDriveSyncCard: React.FC = () => {
  const {
    googleUser,
    isGoogleDriveConnected,
    isSyncingDrive,
    lastDriveSyncTime,
    autoDriveSync,
    setAutoDriveSync,
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncToGoogleDrive,
    syncFromGoogleDrive,
    orders,
    menuItems,
    ingredients,
  } = useApp();

  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [showPullConfirm, setShowPullConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectGoogleDrive();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExecutePush = async () => {
    setShowPushConfirm(false);
    await syncToGoogleDrive(false);
  };

  const handleExecutePull = async () => {
    setShowPullConfirm(false);
    await syncFromGoogleDrive();
  };

  const handleExecuteDisconnect = async () => {
    setShowDisconnectConfirm(false);
    await disconnectGoogleDrive();
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Cloud className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-stone-100">
                গুগল ড্রাইভ লাইভ সিঙ্ক (Google Drive Live Sync)
              </h3>
              {isGoogleDriveConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  সংযুক্ত
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                  ডিসকানেক্টেড
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              আপনার গুগল ড্রাইভে সরাসরি ব্যাকআপ রাখুন এবং যেকোনো ফোন বা কম্পিউটার থেকে সিঙ্ক করুন।
            </p>
          </div>
        </div>

        {/* Live sync spinner badge */}
        {isSyncingDrive && (
          <div className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>সিঙ্ক হচ্ছে...</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!isGoogleDriveConnected || !googleUser ? (
        /* Not Connected State: Official Sign in with Google button per guidelines */
        <div className="py-4 px-3 sm:px-6 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
            <HardDrive className="w-6 h-6 text-stone-400" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-stone-200">
              গুগল ড্রাইভের সাথে POS ডাটা যুক্ত করুন
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              আপনার গুগল একাউন্ট দিয়ে কানেক্ট করলে সেলস, মেনু ও স্টকের সকল ডাটা নিরাপদ গুগল ড্রাইভ ফাইলে (<code>{SYNC_FILE_NAME}</code>) স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।
            </p>
          </div>

          {/* Official Google Sign-In Button */}
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="group relative inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {/* Official Google 4-color SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isConnecting ? 'কানেক্ট করা হচ্ছে...' : 'Sign in with Google (ড্রাইভ সিঙ্ক)'}</span>
          </button>
        </div>
      ) : (
        /* Connected State */
        <div className="space-y-4">
          {/* User Profile & Drive Status Banner */}
          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google Account'}
                  className="w-10 h-10 rounded-full border border-stone-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500 text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                  {googleUser.email ? googleUser.email.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-stone-100 truncate">
                    {googleUser.displayName || 'Google ব্যবহারকারী'}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold shrink-0">
                    Google Drive
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-mono truncate">{googleUser.email}</p>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              type="button"
              onClick={() => setShowDisconnectConfirm(true)}
              className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-stone-800 hover:border-red-500/40 bg-stone-900 hover:bg-red-500/10 text-stone-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ডিসকানেক্ট</span>
            </button>
          </div>

          {/* Sync Stats & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status card */}
            <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800/80 space-y-1.5">
              <span className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
                <CloudCheck className="w-4 h-4 text-emerald-400" />
                ফাইল স্ট্যাটাস:
              </span>
              <p className="font-mono text-xs text-stone-200">
                Google Drive: <code>{SYNC_FILE_NAME}</code>
              </p>
              <p className="text-[11px] text-stone-500">
                সর্বশেষ সিঙ্ক: <strong className="text-stone-300">{lastDriveSyncTime || 'এখনও সিঙ্ক হয়নি'}</strong>
              </p>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-200 block">
                  স্বয়ংক্রিয় লাইভ সিঙ্ক (Auto-Sync)
                </span>
                <span className="text-[11px] text-stone-400 block leading-tight">
                  অর্ডার বা বিক্রয় পরিবর্তনের সাথে সাথে ড্রাইভে সেভ হবে
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoDriveSync}
                  onChange={(e) => setAutoDriveSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {/* Manual Push / Pull Action Buttons with explicit user confirmation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {/* Push to Drive Button */}
            <button
              type="button"
              onClick={() => setShowPushConfirm(true)}
              disabled={isSyncingDrive}
              className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4 shrink-0" />
              <span>ড্রাইভে ব্যাকআপ পাঠান (Push to Drive)</span>
            </button>

            {/* Pull from Drive Button */}
            <button
              type="button"
              onClick={() => setShowPullConfirm(true)}
              disabled={isSyncingDrive}
              className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-[0.98] text-stone-200 hover:text-white text-xs sm:text-sm font-bold border border-stone-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CloudDownload className="w-4 h-4 shrink-0" />
              <span>ড্রাইভ থেকে ডাটা আনুন (Pull from Drive)</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs for Destructive / Mutating operations (Workspace Requirement) */}
      <ConfirmDialog
        isOpen={showPushConfirm}
        title="গুগল ড্রাইভে ব্যাকআপ নিশ্চিতকরণ"
        message={`আপনার বর্তমান ডিভাইসের ${orders.length}টি অর্ডার, ${menuItems.length}টি মেনু আইটেম ও ${ingredients.length}টি উপাদানের তথ্য গুগল ড্রাইভের '${SYNC_FILE_NAME}' ফাইলে আপডেট (Overwrite) করা হবে। আপনি কি নিশ্চিত?`}
        confirmLabel="হ্যাঁ, ড্রাইভে সেভ করুন"
        cancelLabel="বাতিল"
        isDestructive={false}
        onConfirm={handleExecutePush}
        onCancel={() => setShowPushConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showPullConfirm}
        title="গুগল ড্রাইভ থেকে ডাটা রিস্টোর নিশ্চিতকরণ"
        message="সতর্কতা: গুগল ড্রাইভ থেকে ডাটা লোড করলে বর্তমান ডিভাইসের ডাটা ড্রাইভের পূর্ববর্তী ফাইল দ্বারা প্রতিস্থাপিত হবে। আপনি কি ড্রাইভ থেকে নতুন ডাটা লোড করতে চান?"
        confirmLabel="হ্যাঁ, রিস্টোর করুন"
        cancelLabel="বাতিল"
        isDestructive={true}
        onConfirm={handleExecutePull}
        onCancel={() => setShowPullConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        title="গুগল ড্রাইভ ডিসকানেক্ট করবেন?"
        message="গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করলে স্বয়ংক্রিয় ব্যাকআপ সাময়িক বন্ধ থাকবে, তবে আপনার স্থানীয় ডাটা অক্ষত থাকবে। আপনি কি ডিসকানেক্ট করতে চান?"
        confirmLabel="হ্যাঁ, ডিসকানেক্ট করুন"
        cancelLabel="বাতিল"
        isDestructive={false}
        onConfirm={handleExecuteDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
};
