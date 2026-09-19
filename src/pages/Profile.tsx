import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Settings, LogOut, MessageSquare, ShoppingCart, Package, RotateCcw, ShoppingBag } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { userApi, cartApi } from "../services/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [stats, setStats] = useState({ posts: 0, purchases: 0, feedbacks: 0, lostFound: 0, claims: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { icon: ShoppingCart, label: "购物车", path: "/cart", count: cartCount },
    { icon: Package, label: "我的发布", path: "/my-posts", count: stats.posts + stats.lostFound },
    { icon: ShoppingBag, label: "我的购买", path: "/my-purchases", count: stats.purchases },
    { icon: RotateCcw, label: "失物招领", path: "/my-claims", count: stats.claims },
    { icon: MessageSquare, label: "我的反馈", path: "/my-feedback", count: stats.feedbacks },
    { icon: Settings, label: "设置", path: "/settings", count: 0 },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsResponse, cartResponse] = await Promise.all([
        userApi.getStats(),
        cartApi.getAll()
      ]);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      if (cartResponse.data.success) {
        setCartCount(cartResponse.data.data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-gradient-to-r from-primary-500 to-primary-600 pt-12 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.username || "用户"}</h2>
              <p className="text-white/80 text-sm">{user?.role === 'admin' ? '管理员' : '学生'}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-8 bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <button onClick={() => navigate('/my-posts')} className="text-center">
              <p className="text-xl font-bold text-white">{loading ? '...' : stats.posts + stats.lostFound}</p>
              <p className="text-white/80 text-xs">发布</p>
            </button>
            <button onClick={() => navigate('/cart')} className="text-center">
              <p className="text-xl font-bold text-white">{loading ? '...' : cartCount}</p>
              <p className="text-white/80 text-xs">购物车</p>
            </button>
            <button onClick={() => navigate('/my-purchases')} className="text-center">
              <p className="text-xl font-bold text-white">{loading ? '...' : stats.purchases}</p>
              <p className="text-white/80 text-xs">购买</p>
            </button>
            <button onClick={() => navigate('/my-feedback')} className="text-center">
              <p className="text-xl font-bold text-white">{loading ? '...' : stats.feedbacks}</p>
              <p className="text-white/80 text-xs">反馈</p>
            </button>
            <button onClick={() => navigate('/my-claims')} className="text-center">
              <p className="text-xl font-bold text-white">{loading ? '...' : stats.claims}</p>
              <p className="text-white/80 text-xs">失物</p>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => (
            <button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-4 p-4 ${idx !== menuItems.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}>
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-gray-700 font-medium">{item.label}</span>
                {item.count > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="w-full mt-6 py-3 bg-white rounded-xl shadow-sm flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />退出登录
        </button>
      </main>
    </div>
  );
}