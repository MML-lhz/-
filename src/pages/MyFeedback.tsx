import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { feedbackApi } from "../services/api";

export default function MyFeedbackPage() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const response = await feedbackApi.getMyFeedbacks();
      if (response.data.success) {
        setFeedbacks(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { text: "待处理", color: "text-yellow-500", bg: "bg-yellow-50", icon: Clock };
      case "processed": return { text: "已处理", color: "text-green-500", bg: "bg-green-50", icon: CheckCircle };
      case "rejected": return { text: "已驳回", color: "text-red-500", bg: "bg-red-50", icon: AlertCircle };
      default: return { text: status, color: "text-gray-500", bg: "bg-gray-50", icon: Clock };
    }
  };

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      "suggestion": "功能建议",
      "bug": "问题反馈",
      "complaint": "投诉",
      "other": "其他"
    };
    return categories[category] || category;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">我的反馈</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无反馈记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((item: any) => {
              const status = getStatusInfo(item.status);
              const StatusIcon = status.icon;
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-primary-500 text-sm font-medium">{getCategoryText(item.category)}</span>
                    <span className={`flex items-center gap-1 ${status.color} text-sm px-2 py-1 rounded-full ${status.bg}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.text}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{item.content}</p>
                  {item.reply && (
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary-500">
                      <p className="text-xs text-gray-500 mb-1">管理员回复：</p>
                      <p className="text-sm text-gray-700">{item.reply}</p>
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mt-3">提交时间：{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}