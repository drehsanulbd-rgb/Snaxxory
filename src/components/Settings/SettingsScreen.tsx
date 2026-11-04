/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import { GoogleDriveSyncCard } from './GoogleDriveSyncCard';
import {
  KeyRound,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  Check,
  Copy,
  Info,
  Shield,
  FileText,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    adminPin,
    cashierPin,
    updatePins,
    getBackupJSON,
    restoreFromJSON,
    resetToSampleData,
    showToast,
  } = useApp();

  // Change PIN state
  const [newAdminPin, setNewAdminPin] = useState('');
  const [newCashierPin, setNewCashierPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Backup & Restore state
  const [backupJsonText, setBackupJsonText] = useState('');
  const [restoreInputText, setRestoreInputText] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle PIN update
  const handleUpdatePins = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPin || !newCashierPin) {
      setPinChangeMsg({ text: 'উভয় PIN পূরণ করুন।', isError: true });
      return;
    }

    const res = updatePins(newAdminPin, newCashierPin);
    if (res.success) {
      setPinChangeMsg({ text: res.message, isError: false });
      setNewAdminPin('');
      setNewCashierPin('');
    } else {
      setPinChangeMsg({ text: res.message, isError: true });
    }
  };

  // Copy backup to clipboard
  const handleCopyBackup = async () => {
    const json = getBackupJSON();
    setBackupJsonText(json);
    try {
      await navigator.clipboard.writeText(json);
      showToast('ব্যাকআপ JSON টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    } catch {
      showToast('ক্লিপবোর্ডে কপি করতে ব্যর্থ হয়েছে। নিচের বক্স থেকে কপি করুন।', 'warning');
    }
  };

  // Download backup file (.json)
  const handleDownloadBackup = () => {
    const json = getBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snaxxory-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে।', 'success');
  };

  // Trigger restore confirm
  const handleTriggerRestore = () => {
    if (!restoreInputText.trim()) {
      showToast('রিস্টোর করতে ব্যাকআপ JSON টেক্সট পেস্ট করুন।', 'error');
      return;
    }
    setShowRestoreConfirm(true);
  };

  const handleExecuteRestore = () => {
    const res = restoreFromJSON(restoreInputText);
    setShowRestoreConfirm(false);
    if (res.success) {
      setRestoreInputText('');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-3 sm:p-4 pb-20 md:pb-4 space-y-4">
      {/* Daily Backup Reminder Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="text-amber-300 font-bold block text-sm mb-0.5">
            গুরুত্বপূর্ণ ডেটা নিরাপত্তা সতর্কতা:
          </strong>
          আপনার সমস্ত বিক্রয়, স্টক এবং খরচের তথ্য শুধুমাত্র আপনার এই ব্রাউজারে (localStorage)
          সংরক্ষিত আছে। ব্রাউজার ক্যাশ বা হিস্ট্রি ক্লিয়ার হলে তথ্য মুছে যেতে পারে—তাই প্রতিদিন কাজের
          শেষে বা শিফট শেষে অবশ্যই নিচের ব্যাকআপ (Backup) সংরক্ষণ করুন।
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Google Drive Live Cloud Sync */}
        <GoogleDriveSyncCard />

        {/* Change PINs Section */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm text-stone-100">PIN পরিবর্তন করুন</h3>
          </div>
          <p className="text-xs text-stone-400 mb-3">
            অ্যাডমিন ও ক্যাশিয়ার উভয়ের জন্য ৪ থেকে ৮ ডিজিটের পৃথক সংখ্যা নির্ধারণ করুন।
          </p>

          <form onSubmit={handleUpdatePins} className="space-y-3 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  নতুন অ্যাডমিন PIN (বর্তমানে: {adminPin})
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newAdminPin}
                  onChange={e => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="৪-৮ ডিজিটের নতুন PIN"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 tracking-widest focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  নতুন ক্যাশিয়ার PIN (বর্তমানে: {cashierPin})
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newCashierPin}
                  onChange={e => setNewCashierPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="৪-৮ ডিজিটের নতুন PIN"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 tracking-widest focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {pinChangeMsg && (
              <p
                className={`text-xs font-medium ${
                  pinChangeMsg.isError ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {pinChangeMsg.text}
              </p>
            )}

            <button
              type="submit"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>PIN সংরক্ষণ করুন</span>
            </button>
          </form>
        </div>

        {/* Data Backup Section */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-bold text-sm text-stone-100">ডেটা ব্যাকআপ (Backup Data)</h3>
              <p className="text-xs text-stone-400">
                এক ক্লিকে সকল মেনু, স্টক, আজকের ও অতীতের সমস্ত অর্ডার JSON ফরম্যাটে ব্যাকআপ নিন
                (সুরক্ষার জন্য ব্যাকআপে PIN অন্তর্ভুক্ত নয়)।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyBackup}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>JSON টেক্সট কপি করুন</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4 text-stone-300" />
              <span>ফাইল ডাউনলোড (.json)</span>
            </button>
          </div>

          {backupJsonText && (
            <div className="mt-2">
              <span className="text-[11px] text-stone-500 block mb-1">
                সর্বশেষ জেনারেটকৃত ব্যাকআপ প্রিভিউ:
              </span>
              <textarea
                readOnly
                value={backupJsonText}
                rows={4}
                className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-400 select-all focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Data Restore Section */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="font-bold text-sm text-stone-100">ডেটা রিস্টোর (Restore Data)</h3>
              <p className="text-xs text-stone-400">
                পূর্বে কপি করা JSON টেক্সট পেস্ট করে রিস্টোর বাটনে চাপুন (নিশ্চিত করতে দ্বিতীয় ট্যাপ
                প্রয়োজন)।
              </p>
            </div>
          </div>

          <textarea
            value={restoreInputText}
            onChange={e => setRestoreInputText(e.target.value)}
            placeholder="এখানে ব্যাকআপ JSON টেক্সট পেস্ট করুন..."
            rows={4}
            className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-sky-500"
          />

          <button
            type="button"
            disabled={!restoreInputText.trim()}
            onClick={handleTriggerRestore}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>ডেটা রিস্টোর করুন</span>
          </button>
        </div>

        {/* Reset / Sample Data Section */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-stone-300">ডিফল্ট ডেটা রিসেট</h3>
            <p className="text-xs text-stone-500">
              সমস্ত অর্ডার মুছে দিয়ে Snaxxory-এর মূল ৮টি মেনু আইটেম ও প্রাথমিক স্টকে ফিরে যান
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/60 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>রিসেট করুন</span>
          </button>
        </div>
      </div>

      {/* Restore Confirm Dialog (Needs a second confirming tap) */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="ডেটা রিস্টোর নিশ্চিত করুন"
        message="ব্যাকআপ থেকে ডেটা রিস্টোর করলে বর্তমান সমস্ত রেকর্ড প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?"
        confirmLabel="হ্যাঁ, রিস্টোর করুন"
        cancelLabel="ফিরে যান"
        isDestructive={false}
        onConfirm={handleExecuteRestore}
        onCancel={() => setShowRestoreConfirm(false)}
      />

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="সব ডেটা রিসেট করবেন?"
        message="এটি বর্তমান সমস্ত অর্ডার মুছে ফেলবে এবং প্রাথমিক ৮টি আইটেম ও স্টক ফিরিয়ে আনবে। এটি অপরিবর্তনযোগ্য!"
        confirmLabel="হ্যাঁ, রিসেট করুন"
        cancelLabel="বাতিল"
        isDestructive={true}
        onConfirm={() => {
          resetToSampleData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
