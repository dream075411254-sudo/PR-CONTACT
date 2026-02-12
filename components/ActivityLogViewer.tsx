import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLog } from '../types';
import * as DataService from '../services/dataService';
import { Search, History, Clock, User, FileText, Shield, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ActivityLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = () => {
    setLogs(DataService.getActivityLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    if (confirm('คุณต้องการลบประวัติการใช้งานทั้งหมดหรือไม่? (ข้อมูลจะหายไปจากเครื่องนี้ถาวร)')) {
        DataService.clearActivityLogs();
        loadLogs();
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const formatDate = (timestamp: number) => {
    try {
        return new Date(timestamp).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
        });
    } catch (e) {
        return '-';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('ลบ')) return 'text-red-600 bg-red-50';
    if (action.includes('แก้ไข')) return 'text-orange-600 bg-orange-50';
    if (action.includes('เพิ่ม') || action.includes('สร้าง')) return 'text-green-600 bg-green-50';
    if (action.includes('Login') || action.includes('เข้าสู่ระบบ')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-full">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">ประวัติการใช้งานระบบ</h2>
            <p className="text-sm text-gray-500">บันทึกกิจกรรมใน Browser นี้ (LocalStorage)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="ค้นหา..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button variant="secondary" onClick={loadLogs} title="รีเฟรชข้อมูล">
                <RefreshCw size={18} />
            </Button>
            <Button variant="danger" onClick={handleClearLogs} title="ล้างประวัติ">
                <Trash2 size={18} />
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    <div className="flex items-center gap-1"><Clock size={14}/> วันที่ - เวลา</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    <div className="flex items-center gap-1"><User size={14}/> ผู้ใช้งาน</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    <div className="flex items-center gap-1"><Shield size={14}/> กิจกรรม</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1"><FileText size={14}/> รายละเอียด</div>
                </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                            <span className="text-xs text-gray-400 capitalize">{log.userRole}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        {log.details}
                    </td>
                </tr>
                ))}
                {filteredLogs.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                            ไม่พบประวัติการใช้งาน
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};