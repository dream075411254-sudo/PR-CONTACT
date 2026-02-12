import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { X, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        setError('กรุณากรอกรหัสผ่าน');
        return;
    }
    onLogin(password);
    setPassword(''); // Reset password field
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Lock className="mr-2 text-primary" size={24} />
              เข้าสู่ระบบ Editor
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                สำหรับผู้ดูแลระบบเพื่อจัดการข้อมูล (แก้ไข, เพิ่ม, ลบ)
             </div>

             <Input 
                type="password"
                label="รหัสผ่าน"
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                }}
                error={error}
                autoFocus
             />

             <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                    ยกเลิก
                </Button>
                <Button type="submit" className="flex-1">
                    เข้าสู่ระบบ
                </Button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};