import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const authError = params.get('auth_error');
    const authSuccess = params.get('auth_success');

    if (authSuccess) {
      fetchUser().then(() => navigate('/'));
    } else if (authError) {
      alert(`Google auth failed: ${authError}`);
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
}
