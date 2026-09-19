import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, ShoppingBag, RotateCcw, User, Bell, Search, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { marketApi, lostFoundApi, announcementApi } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeLostCount, setActiveLostCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const quickActions = [
    { icon: MessageSquare, label: '问题反馈', color: 'bg-blue-500', path: '/feedback', keywords: ['反馈', '问题', '投诉', '建议'] },
    { icon: ShoppingBag, label: '二手交易', color: 'bg-green-500', path: '/market', keywords: ['交易', '二手', '买卖', '商品'] },
    { icon: RotateCcw, label: '物品归还', color: 'bg-orange-500', path: '/lost-found', keywords: ['归还', '失物', '招领', '丢失'] },
    { icon: Bell, label: '通知公告', color: 'bg-purple-500', path: '/announcements', keywords: ['通知', '公告', '消息'] },
  ];

  useEffect(() => {
    loadProducts();
    loadNotifications();
    loadAnnouncements();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      // 过滤商品
      const filtered = products.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredProducts([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const response = await marketApi.getAll();
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await lostFoundApi.getAll();
      if (response.data.success) {
        const claimedItems = response.data.data.filter((item: any) => 
          item.status === 'claimed' && item.userId === user?.id
        );
        setNotificationCount(claimedItems.length);
        
        const activeItems = response.data.data.filter((item: any) => 
          item.status === 'active'
        );
        setActiveLostCount(activeItems.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await announcementApi.getAll();
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 检查是否匹配服务关键词
      for (const action of quickActions) {
        if (action.keywords.some(kw => searchQuery.includes(kw))) {
          navigate(action.path);
          return;
        }
      }
      // 否则跳转到交易页面搜索
      navigate(`/market?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const matchedServices = searchQuery.trim() 
    ? quickActions.filter(action => 
        action.keywords.some(kw => searchQuery.includes(kw)) ||
        action.label.includes(searchQuery)
      )
    : [];

  const matchedAnnouncements = searchQuery.trim()
    ? announcements.filter(a => 
        a.title.includes(searchQuery) || 
        a.content.includes(searchQuery)
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">校</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">校园服务</h1>
              <p className="text-xs text-gray-500">Campus Service</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">欢迎回来，{user?.username || '同学'}</h2>
          <p className="text-white/80 text-sm mb-4">今天是美好的一天，有什么需要帮助的吗？</p>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务、商品、公告..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </form>
        </div>

        {/* 搜索结果 */}
        {showSearchResults && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4">搜索结果</h3>
            
            {matchedServices.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">相关服务</p>
                <div className="flex flex-wrap gap-2">
                  {matchedServices.map(action => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">相关商品 ({filteredProducts.length})</p>
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.slice(0, 4).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => navigate('/market')}
                      className="bg-gray-50 rounded-xl p-3 text-left"
                    >
                      <div className="w-full h-16 bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{p.title}</h4>
                      <p className="text-primary-500 font-bold text-sm">¥{p.price}</p>
                    </button>
                  ))}
                </div>
                {filteredProducts.length > 4 && (
                  <button 
                    onClick={() => navigate(`/market?search=${encodeURIComponent(searchQuery)}`)}
                    className="w-full mt-2 py-2 text-primary-500 text-sm font-medium"
                  >
                    查看全部 {filteredProducts.length} 个商品
                  </button>
                )}
              </div>
            )}

            {matchedAnnouncements.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">相关公告</p>
                {matchedAnnouncements.map((item, idx) => (
                  <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
                    <h4 className="font-medium text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.content}</p>
                  </div>
                ))}
              </div>
            )}

            {matchedServices.length === 0 && filteredProducts.length === 0 && matchedAnnouncements.length === 0 && (
              <p className="text-gray-500 text-center py-4">未找到相关结果</p>
            )}
          </div>
        )}

        <div>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
            快捷服务
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
            最新公告
          </h3>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无公告</p>
            ) : (
              announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.pinned ? 'bg-red-500' : 'bg-primary-500'}`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.content}</p>
                    <span className="text-xs text-gray-400 mt-2 block">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/announcements')} className="w-full mt-4 py-2 text-primary-500 text-sm font-medium hover:bg-primary-50 rounded-lg transition-colors">
            查看全部公告
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            热门二手
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-gray-50 rounded-xl p-3">
                <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{p.title}</h4>
                <p className="text-primary-500 font-bold mt-1">¥{p.price}</p>
              </div>
            ))}
            {products.length === 0 && [1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-gray-50 rounded-xl p-3">
                <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-800 text-sm line-clamp-1">暂无商品</h4>
                <p className="text-gray-400 font-bold mt-1">--</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/market')} className="w-full mt-4 py-2 text-primary-500 text-sm font-medium hover:bg-primary-50 rounded-lg transition-colors">
            进入二手市场
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
        <div className="max-w-lg mx-auto flex justify-around">
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-primary-500">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">校</span>
            </div>
            <span className="text-xs font-medium">首页</span>
          </button>
          <button onClick={() => navigate('/feedback')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500">
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">反馈</span>
          </button>
          <button onClick={() => navigate('/market')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500">
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs">交易</span>
          </button>
          <button onClick={() => navigate('/lost-found')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500 relative">
            <RotateCcw className="w-6 h-6" />
            {activeLostCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center">
                {activeLostCount}
              </span>
            )}
            <span className="text-xs">归还</span>
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500 relative">
            <User className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notificationCount}
              </span>
            )}
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
}