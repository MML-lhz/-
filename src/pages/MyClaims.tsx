import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, MapPin, Phone, CheckCircle, Clock } from "lucide-react";
import { lostFoundApi } from "../services/api";

export default function MyClaimsPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const response = await lostFoundApi.getMyClaims();
      if (response.data.success) {
        setClaims(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RotateCcw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">失物招领</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {claims.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无认领记录</p>
            <button onClick={() => navigate('/lost-found')} className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl text-sm">
              去帮助他人
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((i: any) => (
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
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{i.location}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{i.contact}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>失主：{i.owner?.username}</span>
                  {i.status === "claimed" && (
                    <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-3 h-3" />等待失主确认</span>
                  )}
                  {i.status === "returned" && (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" />已归还</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}