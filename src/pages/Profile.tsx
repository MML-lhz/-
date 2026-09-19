import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Settings, LogOut, MessageSquare, ShoppingCart, Package, RotateCcw, ShoppingBag, Pencil, Camera, X, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { userApi, cartApi } from "../services/api";

// 读取本地保存的"上次查看数"，key 与菜单项 key 对应
const loadSeenCounts = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem("profileSeenCounts") || "{}");
  } catch {
    return {};
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [stats, setStats] = useState({ posts: 0, purchases: 0, feedbacks: 0, lostFound: 0, claims: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>(loadSeenCounts);
  const [profile, setProfile] = useState({ avatar: "", phone: "", email: "", bio: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ avatar: "", phone: "", email: "", bio: "" });
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { icon: ShoppingCart, label: "购物车", path: "/cart", count: cartCount, key: "cart" },
    { icon: Package, label: "我的发布", path: "/my-posts", count: stats.posts + stats.lostFound, key: "posts" },
    { icon: ShoppingBag, label: "我的购买", path: "/my-purchases", count: stats.purchases, key: "purchases" },
    { icon: RotateCcw, label: "失物招领", path: "/my-claims", count: stats.claims, key: "claims" },
    { icon: MessageSquare, label: "我的反馈", path: "/my-feedback", count: stats.feedbacks, key: "feedbacks" },
    { icon: Settings, label: "修改密码", action: () => setShowPasswordModal(true), key: "password" },
  ];

  useEffect(() => {
    loadStats();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userApi.getMe();
      if (response.data.success) {
        const { avatar, phone, email, bio } = response.data.data;
        setProfile({ avatar: avatar || "", phone: phone || "", email: email || "", bio: bio || "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const openEditModal = () => {
    setEditForm({ ...profile });
    setShowEditModal(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm({ ...editForm, avatar: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await userApi.updateProfile({
        avatar: editForm.avatar,
        phone: editForm.phone,
        email: editForm.email,
        bio: editForm.bio
      });
      if (response.data.success) {
        setProfile({
          avatar: response.data.data.avatar,
          phone: response.data.data.phone,
          email: response.data.data.email,
          bio: response.data.data.bio
        });
        setShowEditModal(false);
        alert("资料更新成功");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert("两次输入的新密码不一致");
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      alert("新密码至少 6 位");
      return;
    }
    setSaving(true);
    try {
      const response = await userApi.updatePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      });
      if (response.data.success) {
        setShowPasswordModal(false);
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        alert("密码修改成功");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "修改失败");
    } finally {
      setSaving(false);
    }
  };

  // 计算某项的新增数 = 当前数 - 上次查看数；只有新增 > 0 时才显示红点
  const getNewCount = (key: string, count: number) => {
    const seen = seenCounts[key] || 0;
    return Math.max(0, count - seen);
  };

  // 点击菜单项：把当前总数记为"已查看"，红点消失
  const handleMenuItemClick = (item: any) => {
    const { key, count, path, action } = item;
    const updated = { ...seenCounts, [key]: count };
    setSeenCounts(updated);
    localStorage.setItem("profileSeenCounts", JSON.stringify(updated));
    if (action) {
      action();
    } else if (path) {
      navigate(path);
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
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary-500" />
                )}
              </div>
              <button onClick={openEditModal} className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user?.username || "用户"}</h2>
              <p className="text-white/80 text-sm">{user?.role === 'admin' ? '管理员' : '学生'}</p>
              {profile.bio && <p className="text-white/70 text-xs mt-1">{profile.bio}</p>}
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
          {menuItems.map((item, idx) => {
            const newCount = getNewCount(item.key, item.count);
            return (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center gap-4 p-4 ${idx !== menuItems.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}
              >
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  {newCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {newCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={handleLogout} className="w-full mt-6 py-3 bg-white rounded-xl shadow-sm flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />退出登录
        </button>
      </main>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">编辑资料</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                <input type="text" value={user?.username || ""} disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                <input type="tel" placeholder="请输入手机号" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <input type="email" placeholder="请输入邮箱" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                <textarea placeholder="介绍一下自己吧" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent h-20 resize-none" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl">取消</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50">
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">修改密码</h2>
              <button onClick={() => setShowPasswordModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">原密码</label>
                <div className="relative">
                  <input type={showOldPwd ? "text" : "password"} placeholder="请输入原密码" value={pwdForm.oldPassword} onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showOldPwd ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                <div className="relative">
                  <input type={showNewPwd ? "text" : "password"} placeholder="至少 6 位" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showNewPwd ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
                <input type="password" placeholder="请再次输入新密码" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl">取消</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50">
                  {saving ? "提交中..." : "确认修改"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}