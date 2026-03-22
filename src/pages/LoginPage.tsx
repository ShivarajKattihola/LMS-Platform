import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithGoogle } from "../firebase";
import { GraduationCap, LogIn, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect path from location state, or default to home
  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Failed to sign in. Please try again.");
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Branding & Info */}
        <div className="space-y-8 hidden lg:block">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Future of Learning</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-bold tracking-tight text-neutral-900 leading-[1.1]"
            >
              Master New Skills <br />
              <span className="text-neutral-400">At Your Own Pace.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-neutral-600 max-w-md leading-relaxed"
            >
              Join thousands of students worldwide. Access high-quality courses, track your progress, and earn certificates.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">Verified Content</h4>
                <p className="text-sm text-neutral-500">Expert-led instruction</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">Community</h4>
                <p className="text-sm text-neutral-500">Learn with peers</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-neutral-200 shadow-2xl shadow-neutral-200/50 space-y-8 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-bl-full -mr-16 -mt-16" />
          
          <div className="space-y-2 relative">
            <div className="flex items-center space-x-2 lg:hidden mb-6">
              <GraduationCap className="w-8 h-8 text-neutral-900" />
              <span className="text-xl font-bold tracking-tight">LMS Platform</span>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome Back</h2>
            <p className="text-neutral-500">Sign in to continue your learning journey.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-neutral-200 text-neutral-900 px-6 py-4 rounded-2xl font-bold hover:bg-neutral-50 hover:border-neutral-900 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-neutral-900"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 font-medium text-center"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="pt-8 border-t border-neutral-100">
            <p className="text-center text-sm text-neutral-500">
              By signing in, you agree to our{" "}
              <Link to="#" className="text-neutral-900 font-bold hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="#" className="text-neutral-900 font-bold hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
