/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Drive scope
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (strictly required by Workspace guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const SYNC_FILE_NAME = 'snaxxory_pos_live_data.json';

export interface DriveSyncResult {
  success: boolean;
  message: string;
  fileId?: string;
  modifiedTime?: string;
  data?: any;
}

/**
 * Initialize auth listener on application load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In popup with Drive permissions.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive এক্সেস টোকেন পাওয়া যায়নি');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Search Google Drive for the existing sync file.
 */
export async function findSyncFileId(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const query = encodeURIComponent(`name = '${SYNC_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Drive find file error:', errText);
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      modifiedTime: data.files[0].modifiedTime,
    };
  }

  return null;
}

/**
 * Upload POS JSON data directly to Google Drive.
 * Creates the file if it doesn't exist, or patches existing file.
 */
export async function uploadToGoogleDrive(token: string, payload: any): Promise<DriveSyncResult> {
  try {
    const existing = await findSyncFileId(token);
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

    if (existing?.id) {
      // Patch existing file
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: bodyStr,
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        throw new Error(`ড্রাইভ ফাইল আপডেট করা যায়নি: ${errorText}`);
      }

      const resJson = await updateRes.json();
      return {
        success: true,
        message: 'গুগল ড্রাইভে সফলভাবে সিঙ্ক সম্পন্ন হয়েছে',
        fileId: existing.id,
        modifiedTime: resJson.modifiedTime || new Date().toISOString(),
      };
    } else {
      // Create new file using multipart upload
      const metadata = {
        name: SYNC_FILE_NAME,
        mimeType: 'application/json',
        description: 'Snaxxory POS live synchronized database',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        bodyStr +
        closeDelimiter;

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`ড্রাইভে নতুন ফাইল তৈরি ব্যর্থ: ${errText}`);
      }

      const createdJson = await createRes.json();
      return {
        success: true,
        message: 'গুগল ড্রাইভে নতুন ডাটা ফাইল তৈরি ও সিঙ্ক হয়েছে',
        fileId: createdJson.id,
        modifiedTime: createdJson.modifiedTime || new Date().toISOString(),
      };
    }
  } catch (error: any) {
    console.error('uploadToGoogleDrive failed:', error);
    return {
      success: false,
      message: error.message || 'গুগল ড্রাইভ সিঙ্ক করতে সমস্যা হয়েছে',
    };
  }
}

/**
 * Fetch and download POS data from Google Drive.
 */
export async function downloadFromGoogleDrive(token: string): Promise<DriveSyncResult> {
  try {
    const existing = await findSyncFileId(token);
    if (!existing?.id) {
      return {
        success: false,
        message: 'গুগল ড্রাইভে কোনো পূর্ববর্তী snaxxory_pos_live_data.json ফাইল পাওয়া যায়নি। প্রথমে ব্যাকআপ সিঙ্ক করুন।',
      };
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`;
    const getRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      throw new Error(`ড্রাইভ থেকে ডাটা আনা যায়নি: ${errText}`);
    }

    const json = await getRes.json();
    return {
      success: true,
      message: 'গুগল ড্রাইভ থেকে ডাটা সফলভাবে ডাউনলোড হয়েছে',
      fileId: existing.id,
      modifiedTime: existing.modifiedTime,
      data: json,
    };
  } catch (error: any) {
    console.error('downloadFromGoogleDrive failed:', error);
    return {
      success: false,
      message: error.message || 'ড্রাইভ থেকে ডাটা পড়তে ত্রুটি হয়েছে',
    };
  }
}
