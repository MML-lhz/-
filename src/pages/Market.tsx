import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Search, Plus, Camera, X, ShoppingCart, CheckCircle } from "lucide-react";
import { marketApi, cartApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function MarketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", price: "", category: "数码产品", condition: "全新" });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const categories = ["数码产品", "学习用品", "生活用品", "体育器材", "其他"];
  const conditions = ["全新", "几乎全新", "轻微使用", "明显使用"];

  useEffect(() => {
    loadProducts();
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(products.filter((p: any) => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const params = user ? { userId: user.id } as any : undefined;
      const response = await marketApi.getAll(params);
      if (response.data.success) {
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
      }
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
      await marketApi.publish({ ...formData, price: Number(formData.price), images });
      setShowForm(false);
      setFormData({ title: "", description: "", price: "", category: "数码产品", condition: "全新" });
      setImages([]);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      alert("请先登录");
      navigate("/login");
      return;
    }

    setAddingToCartId(productId);
    try {
      const response = await cartApi.add(productId);
      if (response.data.success) {
        alert("已添加到购物车！");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "添加失败");
    } finally {
      setAddingToCartId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">二手交易</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索商品名称、描述、类别..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
        {!showForm && user?.role !== "admin" && (
          <button onClick={() => setShowForm(true)} className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 mb-6">
            <Plus className="w-5 h-5" /> 发布商品
          </button>
        )}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">发布商品</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品图片（最多4张）</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input type="text" placeholder="请输入商品名称" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
                <input type="number" placeholder="请输入价格" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成色</label>
                <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea placeholder="请详细描述商品" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none" required />
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
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchQuery ? "未找到相关商品" : "暂无商品"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="relative w-full h-32 bg-gray-100 flex items-center justify-center">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  )}
                  {p.status === "sold" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> 已售出
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{p.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-500 font-bold">¥{p.price}</span>
                    <span className="text-xs text-gray-400">{p.condition}</span>
                  </div>
                  {p.status === "available" && user && p.userId !== user.id ? (
                    <button 
                      onClick={() => handleAddToCart(p.id)}
                      disabled={addingToCartId === p.id}
                      className="w-full mt-2 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {addingToCartId === p.id ? "添加中..." : "加入购物车"}
                    </button>
                  ) : p.status === "available" && !user ? (
                    <button 
                      onClick={() => navigate("/login")}
                      className="w-full mt-2 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 hover:bg-primary-600 transition-colors"
                    >
                      登录后购买
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}