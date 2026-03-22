import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, signInWithGoogle, logout } from "./firebase";
import { LogIn, LogOut, BookOpen, User as UserIcon, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import HomePage from "./pages/HomePage";
import SubjectPage from "./pages/SubjectPage";
import LearningPage from "./pages/LearningPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
          <Navbar user={user} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/subjects/:subjectId" element={<SubjectPage />} />
              <Route 
                path="/subjects/:subjectId/video/:videoId" 
                element={user ? <LearningPage user={user} /> : <Navigate to="/login" state={{ from: { pathname: window.location.pathname } }} replace />} 
              />
              <Route 
                path="/profile" 
                element={user ? <ProfilePage user={user} /> : <Navigate to="/login" state={{ from: { pathname: "/profile" } }} replace />} 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function Navbar({ user }: { user: FirebaseUser | null }) {
  return (
    <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <GraduationCap className="w-8 h-8 text-neutral-900 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">LMS Platform</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Courses
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={logout}
                  className="flex items-center space-x-1 text-sm font-medium text-neutral-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
                )}
              </div>
            ) : (
              <Link 
                to="/login"
                className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
