import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as DataService from '../services/dataService';
import { Button } from './Button';
import { Input } from './Input';
import { Users, UserPlus, Shield, ShieldCheck, Lock, Trash2, Edit, Save, X, RefreshCw } from 'lucide-react';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({
    id: '',
    username: '',
    password: '',
    name: '',
    role: 'editor'
  });

  useEffect(() => {
    loadUsers();
    const savedUserJson = localStorage.getItem('pr_app_user');
    if (savedUserJson) {
        setCurrentUser(JSON.parse(savedUserJson));
    }
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      id: DataService.generateUUID(),
      username: '',
      password: '',
      name: '',
      role: 'editor'
    });
    setIsEditing(true);
  };

  const handleEdit = (user: User) => {
    setFormData({ ...user });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (confirm('ยืนยันการลบผู้ใช้งานนี้?')) {
      try {
        setIsLoading(true);
        await DataService.deleteUser(id, currentUser);
        await loadUsers();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }
    
    setIsLoading(true);
    try {
        const userToSave = {
            ...formData,
            username: formData.username.trim(),
            password: formData.password.trim(),
            name: formData.name.trim()
        };

        await DataService.saveUser(userToSave, currentUser);
        setIsEditing(false);
        await loadUsers();
    } catch (error: any) {
        alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Lock size={16} className="text-red-500" />;
      case 'editor': return <ShieldCheck size={16} className="text-orange-500" />;
      default: return <Shield size={16} className="text-green-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>
            <p className="text-sm text-gray-500">ข้อมูลผู้ใช้ถูกซิงค์กับระบบ Cloud เพื่อให้ล็อกอินได้ทุกเครื่อง</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </Button>
          {!isEditing && (
              <Button onClick={handleAddNew}>
                  <UserPlus size={18} className="mr-2" />
                  เพิ่มผู้ใช้งาน
              </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b flex justify-between items-center">
                <span>{formData.id ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</span>
                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input 
                    label="ชื่อ-นามสกุล (Display Name)" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสิทธิ์ (Role)</label>
                    <select 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    >
                        <option value="viewer">Viewer (ดูได้อย่างเดียว)</option>
                        <option value="editor">Editor (แก้ไขข้อมูลได้)</option>
                        <option value="admin">Admin (จัดการระบบได้)</option>
                    </select>
                </div>
                <Input 
                    label="ชื่อผู้ใช้ (Username)" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                    placeholder="ภาษาอังกฤษ หรือ ตัวเลข"
                />
                <Input 
                    label="รหัสผ่าน (Password)" 
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="ตั้งรหัสผ่าน..."
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>ยกเลิก</Button>
                <Button type="submit" isLoading={isLoading}>
                    <Save size={18} className="mr-2" />
                    บันทึกไปยัง Cloud
                </Button>
            </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้งาน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สิทธิ์</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                        {user.name.charAt(0)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full gap-1 ${getRoleBadgeColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.id !== '1' && (
                    <>
                      <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {user.id === '1' && <span className="text-gray-400 text-xs italic">System Admin</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && users.length === 0 && (
          <div className="p-12 text-center text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div>
        )}
      </div>
    </div>
  );
};