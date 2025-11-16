import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, LucideTrainFront as Train } from 'lucide-react';
import railwayBg from '../../assets/railway-bg.mp4';
import { BackgroundVideo } from '../common/BackgroundVideo';

interface LoginProps {
  onToggleForm: () => void;
}

export const Login = ({ onToggleForm }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Video background using imported file */}
      <BackgroundVideo videoSrc={railwayBg} />

      <div className="max-w-md w-full glass-card z-10">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <Train className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center mb-8 text-gray-100" style={{ color: "rgba(255,255,255,0.88)" }}>
          Sign in to continue to Railway Reservation
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/70"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/70"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-50">
            Don't have an account?{' '}
            <button
              onClick={onToggleForm}
              className="text-blue-200 font-semibold hover:text-blue-300 transition"
            >
              Sign up
            </button>
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-200 text-center">
            Demo: admin@railway.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

