import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Users, Shield, UserCog, Lock, Info } from 'lucide-react';
import { User, UserRole } from '../types';
import * as DataService from '../services/dataService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    try {
      const user = await DataService.authenticateUser(cleanUsername, cleanPassword);
      
      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-primary to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Info */}
        <div className="md:w-1/2 bg-blue-50 p-8 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-blue-100">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <Users size={48} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">PR Manager</h1>
          <p className="text-gray-600 mb-8">ระบบบริหารจัดการฐานข้อมูลสื่อมวลชน<br/>และเครือข่ายประชาสัมพันธ์</p>
          
          <div className="space-y-4 w-full max-w-xs text-left text-sm text-gray-500">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <Shield className="text-green-600" size={20} />
              <div>
                <span className="font-semibold text-gray-900 block">Viewer</span>
                เข้าดูข้อมูลและสถิติ
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <UserCog className="text-orange-500" size={20} />
              <div>
                <span className="font-semibold text-gray-900 block">Editor</span>
                จัดการรายชื่อผู้ติดต่อ
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <Lock className="text-red-500" size={20} />
              <div>
                <span className="font-semibold text-gray-900 block">Admin</span>
                จัดการระบบและตั้งค่า
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">เข้าสู่ระบบ</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="ชื่อผู้ใช้งาน (Username)"
              placeholder="กรอกชื่อผู้ใช้งาน..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <Input 
              label="รหัสผ่าน (Password)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
             <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
             <div className="text-xs text-gray-500">
                <p className="font-semibold text-gray-700 mb-1">ไม่มีบัญชีผู้ใช้งาน?</p>
                <p>กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อทำการสร้างบัญชีและรับรหัสผ่านสำหรับเข้าใช้งาน</p>
             </div>
          </div>
          
          <p className="mt-6 text-xs text-center text-gray-400">
             © 2024 PR Contact Manager System
          </p>
        </div>
      </div>
    </div>
  );
};