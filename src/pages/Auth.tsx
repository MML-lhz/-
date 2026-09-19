import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const response = await authApi.login({ username: formData.username, password: formData.password });
        if (response.data.success) {
          const { token, id, username, role } = response.data.data;
          login({ id, username, role }, token);
          navigate('/');
        }
      } else {
        const response = await authApi.register({ username: formData.username, password: formData.password, role: formData.role });
        if (response.data.success) {
          setError('注册成功，请登录');
          setIsLogin(true);
          setFormData({ ...formData, password: '' });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{isLogin ? '登录' : '注册'}</h1>
            <p className="text-gray-500 mt-2">{isLogin ? '欢迎回到校园服务平台' : '创建您的账户'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="请输入用户名" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="hidden" />
                    <div className={`py-3 text-center border rounded-xl cursor-pointer ${formData.role === 'student' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600'}`}>
                      学生
                    </div>
                  </label>
                  <label className="flex-1">
                    <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="hidden" />
                    <div className={`py-3 text-center border rounded-xl cursor-pointer ${formData.role === 'admin' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600'}`}>
                      管理员
                    </div>
                  </label>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} placeholder="请输入密码" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:bg-primary-300">
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary-500 font-medium ml-1 hover:underline">
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
