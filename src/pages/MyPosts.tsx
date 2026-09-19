import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CheckCircle, Clock, Trash2, Plus, MapPin, RotateCcw } from "lucide-react";
import { marketApi, lostFoundApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<"all" | "market" | "lostfound">(searchParams.get("tab") as "all" | "market" | "lostfound" || "all");
  const [marketPosts, setMarketPosts] = useState<any[]>([]);
  const [lostFoundPosts, setLostFoundPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const [marketRes, lostFoundRes] = await Promise.all([
        marketApi.getMyPosts(),
        lostFoundApi.getMyPosts()
      ]);
      
      if (marketRes.data.success) {
        setMarketPosts(marketRes.data.data);
      }
      
      if (lostFoundRes.data.success) {
        setLostFoundPosts(lostFoundRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMarket = async (id: number) => {
    if (!confirm("确定要删除此商品吗？")) return;
    setDeletingId(`market-${id}`);
    try {
      const response = await marketApi.delete(id);
      if (response.data.success) {
        loadPosts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const getMarketStatus = (status: string) => {
    switch (status) {
      case "available": return { text: "在售", color: "text-green-500", bg: "bg-green-50" };
      case "sold": return { text: "已售出", color: "text-blue-500", bg: "bg-blue-50" };
      default: return { text: status, color: "text-gray-500", bg: "bg-gray-50" };
    }
  };

  const getLostFoundStatus = (status: string) => {
    switch(status) {
      case "active": return { text: "待认领", color: "text-green-500", bg: "bg-green-50" };
      case "claimed": return { text: "已认领", color: "text-yellow-500", bg: "bg-yellow-50" };
      case "returned": return { text: "已归还", color: "text-gray-500", bg: "bg-gray-50" };
      default: return { text: status, color: "text-gray-500", bg: "bg-gray-50" };
    }
  };

  const filteredMarketPosts = tab === "lostfound" ? [] : marketPosts;
  // 过滤掉已归还的失物招领，只显示待认领和已认领的
  const filteredLostFoundPosts = tab === "market" ? [] : lostFoundPosts.filter(item => item.status !== "returned");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">我的发布</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4 bg-white rounded-2xl shadow-sm p-2">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === "all" ? "bg-primary-500 text-white" : "text-gray-700"}`}
          >
            全部 ({marketPosts.length + lostFoundPosts.length})
          </button>
          <button
            onClick={() => setTab("market")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === "market" ? "bg-primary-500 text-white" : "text-gray-700"}`}
          >
            商品 ({marketPosts.length})
          </button>
          <button
            onClick={() => setTab("lostfound")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === "lostfound" ? "bg-primary-500 text-white" : "text-gray-700"}`}
          >
            失物 ({lostFoundPosts.length})
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => navigate('/market')}
            className="py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> 发布商品
          </button>
          <button
            onClick={() => navigate('/lost-found')}
            className="py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> 发布失物
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* 商品发布列表 */}
            {filteredMarketPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-600 mb-3 px-2">商品发布</h3>
                <div className="space-y-4">
                  {filteredMarketPosts.map((item: any) => {
                    const status = getMarketStatus(item.status);
                    return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.images && item.images.length > 0 ? (
                              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-gray-800 line-clamp-2">{item.title}</h3>
                              <span className={`flex items-center gap-1 ${status.color} text-sm flex-shrink-0 px-2 py-1 rounded-full ${status.bg}`}>
                                {item.status === "sold" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                {status.text}
                              </span>
                            </div>
                            <p className="text-primary-500 font-bold mt-1">¥{item.price}</p>
                            <p className="text-gray-400 text-sm mt-1">{item.category} · {item.condition}</p>
                            {item.buyer && (
                              <p className="text-gray-500 text-sm mt-2">买家：{item.buyer.username}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                              {item.status === "sold" && item.soldAt 
                                ? `售出时间：${new Date(item.soldAt).toLocaleString()}` 
                                : new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {item.status === "available" && (
                            <button 
                              onClick={() => handleDeleteMarket(item.id)}
                              disabled={deletingId === `market-${item.id}`}
                              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 失物发布列表 */}
            {filteredLostFoundPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-600 mb-3 px-2">失物发布</h3>
                <div className="space-y-4">
                  {filteredLostFoundPosts.map((item: any) => {
                    const status = getLostFoundStatus(item.status);
                    return (
                      <div key={`lf-${item.id}`} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${item.type === "lost" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                              {item.type === "lost" ? "寻物" : "招领"}
                            </span>
                            <h4 className="font-medium text-gray-800">{item.title}</h4>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color} ${status.bg}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{item.location}
                          </span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        {item.claimer && (
                          <p className="text-xs text-gray-500 mt-2">
                            认领人：{item.claimer.username}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredMarketPosts.length === 0 && filteredLostFoundPosts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无发布记录</p>
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => navigate('/market')}
                    className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg"
                  >
                    发布商品
                  </button>
                  <button
                    onClick={() => navigate('/lost-found')}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg"
                  >
                    发布失物
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}