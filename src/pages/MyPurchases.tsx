import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CheckCircle } from "lucide-react";
import { marketApi } from "../services/api";

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const response = await marketApi.getMyPurchases();
      if (response.data.success) {
        setPurchases(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">我的购买</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无购买记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((item: any) => (
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
                      <span className="flex items-center gap-1 text-green-500 text-sm flex-shrink-0">
                        <CheckCircle className="w-4 h-4" /> 已购买
                      </span>
                    </div>
                    <p className="text-primary-500 font-bold mt-1">¥{item.price}</p>
                    <p className="text-gray-400 text-sm mt-1">{item.category} · {item.condition}</p>
                    {item.seller && (
                      <p className="text-gray-500 text-sm mt-2">
                        卖家：{item.seller.username}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      购买时间：{new Date(item.soldAt || item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
