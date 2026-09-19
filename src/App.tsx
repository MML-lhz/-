import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Feedback from "@/pages/Feedback";
import Market from "@/pages/Market";
import LostFound from "@/pages/LostFound";
import Profile from "@/pages/Profile";
import Cart from "@/pages/Cart";
import MyPosts from "@/pages/MyPosts";
import MyFeedback from "@/pages/MyFeedback";
import MyClaims from "@/pages/MyClaims";
import MyPurchases from "@/pages/MyPurchases";
import Announcements from "@/pages/Announcements";
import SplashScreen from "@/components/SplashScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        login(user, token);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setInitialized(true);
  }, [login]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!initialized) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        } />
        <Route path="/market" element={
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        } />
        <Route path="/lost-found" element={
          <ProtectedRoute>
            <LostFound />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/my-posts" element={
          <ProtectedRoute>
            <MyPosts />
          </ProtectedRoute>
        } />
        <Route path="/my-feedback" element={
          <ProtectedRoute>
            <MyFeedback />
          </ProtectedRoute>
        } />
        <Route path="/my-claims" element={
          <ProtectedRoute>
            <MyClaims />
          </ProtectedRoute>
        } />
        <Route path="/my-purchases" element={
          <ProtectedRoute>
            <MyPurchases />
          </ProtectedRoute>
        } />
        <Route path="/announcements" element={
          <ProtectedRoute>
            <Announcements />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
