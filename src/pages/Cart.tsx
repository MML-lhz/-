import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { cartApi } from "../services/api";

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await cartApi.getAll();
      if (response.data.success) {
        setCartItems(response.data.data);
        // 默认全选
        setSelectedItems(response.data.data.map(item => item.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    if (!confirm("确定要从购物车移除此商品吗？")) return;
    
    try {
      const response = await cartApi.remove(cartItemId);
      if (response.data.success) {
        loadCart();
        setSelectedItems(prev => prev.filter(id => id !== cartItemId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "移除失败");
    }
  };

  const handleToggleSelect = (cartItemId: number) => {
    setSelectedItems(prev => 
      prev.includes(cartItemId) 
        ? prev.filter(id => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const getTotalPrice = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.product.price, 0);
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      alert("请选择要结算的商品");
      return;
    }

    if (!confirm(`确定要结算选中的 ${selectedItems.length} 个商品吗？总金额：¥${getTotalPrice()}`)) return;

    setCheckingOut(true);
    try {
      const response = await cartApi.checkout(selectedItems);
      if (response.data.success) {
        const { purchasedItems, errors, totalPurchased, totalErrors } = response.data.data;
        
        if (totalPurchased > 0) {
          alert(`成功购买 ${totalPurchased} 个商品！`);
        }
        
        if (totalErrors > 0) {
          const errorMessages = errors.map(e => e.message).join('\n');
          alert(`部分商品购买失败：\n${errorMessages}`);
        }
        
        loadCart();
        setSelectedItems([]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "结算失败");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">购物车</h1>
          <span className="text-sm text-gray-500 ml-auto">
            {cartItems.length} 件商品
          </span>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>购物车是空的</p>
            <button 
              onClick={() => navigate('/market')}
              className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg"
            >
              去逛逛
            </button>
          </div>
        ) : (
          <>
            {/* 全选按钮 */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
              <button 
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedItems.length === cartItems.length ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                  {selectedItems.length === cartItems.length && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-700">全选</span>
              </button>
              <span className="text-sm text-gray-500">
                已选 {selectedItems.length} 件
              </span>
            </div>

            {/* 购物车商品列表 */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex gap-4">
                    {/* 选择框 */}
                    <button 
                      onClick={() => handleToggleSelect(item.id)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center self-center"
                      style={{
                        borderColor: selectedItems.includes(item.id) ? '#f97316' : '#d1d5db',
                        backgroundColor: selectedItems.includes(item.id) ? '#f97316' : 'transparent'
                      }}
                    >
                      {selectedItems.includes(item.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                    
                    {/* 商品图片 */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 line-clamp-2">{item.product.title}</h3>
                      <p className="text-primary-500 font-bold mt-1">¥{item.product.price}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.product.category} · {item.product.condition}</p>
                      {item.product.seller && (
                        <p className="text-gray-500 text-xs mt-1">
                          卖家：{item.product.seller.username}
                        </p>
                      )}
                    </div>
                    
                    {/* 移除按钮 */}
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 结算区域 */}
            <div className="bg-white rounded-xl shadow-sm p-4 sticky bottom-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">合计</p>
                  <p className="text-xl font-bold text-primary-500">¥{getTotalPrice()}</p>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={checkingOut || selectedItems.length === 0}
                  className="px-8 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingOut ? "结算中..." : `结算 (${selectedItems.length})`}
                </button>
              </div>
              {selectedItems.length === 0 && (
                <p className="text-xs text-gray-400 text-center">
                  请选择要结算的商品
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}