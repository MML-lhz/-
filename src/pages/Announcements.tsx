import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Plus, Trash2, X, Edit3, Pin, PinOff, AlertCircle, Info, Bell, FileText } from "lucide-react";
import { announcementApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

const categories = [
  { value: "通知", label: "通知", icon: Bell },
  { value: "公告", label: "公告", icon: FileText },
  { value: "提醒", label: "提醒", icon: AlertCircle },
  { value: "其他", label: "其他", icon: Info },
];

const getCategoryColor = (category: string) => {
  switch(category) {
    case "通知": return "bg-blue-100 text-blue-700";
    case "公告": return "bg-red-100 text-red-700";
    case "提醒": return "bg-yellow-100 text-yellow-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === "admin";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", category: "通知", pinned: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await announcementApi.getAll();
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await announcementApi.update(editingId, formData);
      } else {
        await announcementApi.publish(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: "", content: "", category: "通知", pinned: false });
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert(editingId ? "更新公告失败" : "发布公告失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此公告吗？")) return;
    try {
      await announcementApi.delete(id);
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("删除失败");
    }
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setFormData({
      title: a.title,
      content: a.content,
      category: a.category || "通知",
      pinned: a.pinned || false
    });
    setShowForm(true);
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    try {
      await announcementApi.update(id, { pinned: !currentPinned });
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("操作失败");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="w-8 h-8 text-primary-500 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">公告通知</h1>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="w-10 h-10 flex items-center justify-center bg-primary-500 rounded-full shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      {/* 发布/编辑公告表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? "编辑公告" : "发布公告"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="w-8 h-8 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入公告标题"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        formData.category === cat.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[150px] resize-none"
                  placeholder="请输入公告内容"
                  required
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="pinned" className="text-sm text-gray-700 flex items-center gap-1">
                  <Pin className="w-4 h-4" />
                  置顶公告
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {submitting ? "提交中..." : (editingId ? "更新公告" : "发布公告")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无公告</p>
            {isAdmin && (
              <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl text-sm">
                发布第一条公告
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <div key={a.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${a.pinned ? 'border-red-500' : 'border-primary-500'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(a.category || '通知')}`}>
                      {a.category || '通知'}
                    </span>
                    {a.pinned && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        置顶
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTogglePin(a.id, a.pinned)} className="text-gray-400 hover:text-primary-500">
                        {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(a)} className="text-gray-400 hover:text-primary-500">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-800 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                <div className="text-xs text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Megaphone className="w-3 h-3" />
                    {a.author?.username || "管理员"}
                  </span>
                  <span>{formatDate(a.createdAt)}</span>
                </div>
                {a.updatedAt !== a.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    更新于：{formatDate(a.updatedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}