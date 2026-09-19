import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, MapPin, Phone, Plus, Camera, X, Locate, Loader2, Search } from "lucide-react";
import { lostFoundApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LostFoundPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: "lost", title: "", description: "", location: "", contact: "" });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [contactError, setContactError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await lostFoundApi.getAll();
      if (response.data.success) setItems(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 根据关键词和类型过滤，只显示待认领的物品
  const filteredItems = useMemo(() => {
    let result = items.filter((item: any) => item.status !== "returned");
    
    if (typeFilter !== "all") {
      result = result.filter((item: any) => item.type === typeFilter);
    }
    
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((item: any) => 
        item.title?.toLowerCase().includes(kw) ||
        item.description?.toLowerCase().includes(kw) ||
        item.location?.toLowerCase().includes(kw)
      );
    }
    
    return result;
  }, [items, searchKeyword, typeFilter]);

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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("您的浏览器不支持地理位置功能");
      return;
    }

    setGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 尝试通过逆地理编码获取地址
        try {
          // 使用高德地图逆地理编码 API (需要配置 key) 或使用备用方案
          // 这里使用免费的 Nominatim 服务，增加超时时间
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          const data = await response.json();
          
          if (data.display_name) {
            // 简化地址显示
            const parts = data.display_name.split(',').filter(Boolean).slice(0, 4).join(',');
            setFormData(prev => ({ ...prev, location: parts }));
            setLocationError("");
          } else {
            setFormData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          }
        } catch (err: any) {
          // 如果逆地理编码失败，使用经纬度
          if (err.name === 'AbortError') {
            setLocationError("地址解析超时，已使用坐标定位");
          }
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        }
        
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("您拒绝了位置请求，请在浏览器设置中允许访问位置");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("无法获取位置信息，请检查网络连接");
            break;
          case error.TIMEOUT:
            setLocationError("获取位置超时，请重试或手动输入地址");
            break;
          default:
            setLocationError("获取位置失败");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证电话号码
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.contact)) {
      setContactError("请输入正确的11位手机号码");
      return;
    }
    
    setLoading(true);
    setContactError("");
    try {
      await lostFoundApi.publish({ ...formData, images } as any);
      setShowForm(false);
      setFormData({ type: "lost", title: "", description: "", location: "", contact: "" });
      setImages([]);
      loadItems();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id: number) => {
    if (!user) {
      alert("请先登录");
      navigate("/login");
      return;
    }
    if (!confirm("确定要认领此物品吗？")) return;
    try {
      const response = await lostFoundApi.claim(id, { message: "" });
      if (response.data.success) {
        alert("认领成功！请等待失主确认");
        loadItems();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "认领失败");
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await lostFoundApi.confirm(id);
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-700";
      case "claimed": return "bg-yellow-100 text-yellow-700";
      case "returned": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "active": return "待认领";
      case "claimed": return "已认领";
      case "returned": return "已归还";
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
          <h1 className="text-xl font-bold text-gray-800">物品归还</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 mb-6">
            <Plus className="w-5 h-5" /> 发布信息
          </button>
        )}

        {!showForm && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索物品名称、描述或地点..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${typeFilter === "all" ? "bg-primary-500 text-white" : "bg-white text-gray-700"}`}
              >
                全部
              </button>
              <button
                onClick={() => setTypeFilter("lost")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${typeFilter === "lost" ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
              >
                寻物启事
              </button>
              <button
                onClick={() => setTypeFilter("found")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${typeFilter === "found" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`}
              >
                失物招领
              </button>
            </div>

            {searchKeyword && (
              <p className="text-sm text-gray-500 mb-3">
                找到 <span className="text-primary-500 font-bold">{filteredItems.length}</span> 条相关结果
              </p>
            )}
          </>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">发布信息</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <button type="button" onClick={() => setFormData({ ...formData, type: "lost" })} className={`flex-1 py-3 rounded-xl font-medium ${formData.type === "lost" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-700"}`}>寻物启事</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: "found" })} className={`flex-1 py-3 rounded-xl font-medium ${formData.type === "found" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-700"}`}>失物招领</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input type="text" placeholder="请输入物品名称" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea placeholder="请描述物品特征" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none" required />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">地点</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="请输入地点或点击定位" 
                      value={formData.location} 
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                      required 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-4 py-3 bg-primary-50 text-primary-500 rounded-xl flex items-center gap-2 hover:bg-primary-100 transition-colors disabled:opacity-50"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Locate className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="text-red-500 text-xs mt-1">{locationError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系方式（手机号）</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="请输入11位手机号码" 
                    value={formData.contact} 
                    onChange={(e) => { setFormData({ ...formData, contact: e.target.value }); setContactError(""); }} 
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${contactError ? 'border-red-500' : 'border-gray-200'}`} 
                    maxLength={11}
                    required 
                  />
                </div>
                {contactError && (
                  <p className="text-red-500 text-xs mt-1">{contactError}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">请输入11位有效手机号码（如：13812345678）</p>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowForm(false); setImages([]); }} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl">
                  {loading ? "发布中..." : "发布"}
                </button>
              </div>
            </form>
          </div>
        )}
        {showForm ? null : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchKeyword ? `未找到"${searchKeyword}"相关的信息` : "暂无他人发布的失物信息"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((i: any) => (
              <div key={i.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${i.type === "lost" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{i.type === "lost" ? "寻物" : "招领"}</span>
                    <h4 className="font-medium text-gray-800">{i.title}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(i.status)}`}>{getStatusText(i.status)}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{i.description}</p>
                {i.images && i.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {i.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{i.location}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{i.contact}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{i.user?.username}</span>
                  {i.status === "active" && i.userId !== user?.id && <button onClick={() => handleClaim(i.id)} className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg">认领</button>}
                  {i.status === "active" && i.userId === user?.id && <span className="text-xs text-gray-400">这是您发布的物品</span>}
                  {i.status === "claimed" && i.userId === user?.id && <button onClick={() => handleConfirm(i.id)} className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg">确认归还</button>}
                  {i.status === "claimed" && i.userId !== user?.id && i.claimerId === user?.id && <span className="text-xs text-green-500">已认领成功，等待失主确认</span>}
                  {i.status === "claimed" && i.userId !== user?.id && i.claimerId !== user?.id && <span className="text-xs text-gray-400">已被他人认领</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
