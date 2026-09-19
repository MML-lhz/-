import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageSquare, Plus, Camera, X } from "lucide-react";
import { feedbackApi } from "../services/api";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: "设施维护", title: "", content: "" });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const categories = ["设施维护", "卫生问题", "安全隐患", "服务建议", "其他"];

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const response = await feedbackApi.getAll();
      if (response.data.success) setFeedbacks(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages].slice(0, 4));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feedbackApi.submit({ ...formData, images });
      setShowForm(false);
      setFormData({ category: "设施维护", title: "", content: "" });
      setImages([]);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "processing": return "bg-blue-100 text-blue-700";
      case "resolved": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "pending": return "待处理";
      case "processing": return "处理中";
      case "resolved": return "已解决";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">问题反馈</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 mb-6">
            <Plus className="w-5 h-5" /> 提交反馈
          </button>
        )}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">提交反馈</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">反馈类别</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input type="text" placeholder="请输入反馈标题" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细内容</label>
                <textarea placeholder="请详细描述您遇到的问题" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图片（最多4张）</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageSelect}
                  className="hidden" 
                />
                <input 
                  ref={cameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden" 
                />
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-primary-500 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-primary-50 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-primary-500" />
                        <span className="text-xs text-primary-500">拍照</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary-500 transition-colors"
                      >
                        <Plus className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400">上传</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowForm(false); setImages([]); }} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />{loading ? "提交中..." : "提交"}
                </button>
              </div>
            </form>
          </div>
        )}
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无反馈记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((f: any) => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">{f.category}</span>
                    <h4 className="font-medium text-gray-800 mt-2">{f.title}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(f.status)}`}>{getStatusText(f.status)}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{f.content}</p>
                {f.images && f.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {f.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{f.user?.username || "匿名"}</span>
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}