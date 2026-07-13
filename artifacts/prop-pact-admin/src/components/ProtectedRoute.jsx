import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

// Status machine:
//   idle      – waiting for auth state to resolve
//   checking  – Firestore role lookup in progress
//   granted   – confirmed admin
//   denied    – signed out; access denied shown
export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [roleStatus, setRoleStatus] = useState('idle');
  // Track which uid we already verified so we don't re-check on unrelated re-renders
  const checkedUidRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    // After a sign-out triggered by a denial, currentUser becomes null.
    // Keep showing the Access Denied screen instead of redirecting.
    if (!currentUser) return;

    // Already verified this user — skip duplicate Firestore call
    if (checkedUidRef.current === currentUser.uid) return;

    checkedUidRef.current = currentUser.uid;
    setRoleStatus('checking');

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const isAdmin = snap.exists() && snap.data().role === 'admin';

        if (isAdmin) {
          setRoleStatus('granted');
        } else {
          await signOut(auth);
          setRoleStatus('denied');
        }
      } catch (err) {
        console.error('[ProtectedRoute] Role check failed:', err);
        await signOut(auth);
        setRoleStatus('denied');
      }
    })();
  }, [currentUser, loading]);

  /* ── Loading / checking ── */
  if (loading || roleStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-7 h-7 text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  /* ── Access denied ── */
  if (roleStatus === 'denied') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-5">
            <svg
              className="w-7 h-7 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your account does not have admin privileges. You have been signed
            out.
          </p>
          <button
            onClick={() => {
              checkedUidRef.current = null;
              setRoleStatus('idle');
              navigate('/login', { replace: true });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  /* ── Not authenticated ── */
  if (!currentUser || roleStatus === 'idle') {
    return <Navigate to="/login" replace />;
  }

  /* ── Granted ── */
  return children;
}
