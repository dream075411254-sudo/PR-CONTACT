import React, { useMemo } from 'react';
import { Contact } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Users, Building2, Mail, Phone, MapPin, Database } from 'lucide-react';

interface StatsProps {
  contacts: Contact[];
}

const COLORS = ['#0f4c81', '#e1ad01', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Stats: React.FC<StatsProps> = ({ contacts }) => {
  const stats = useMemo(() => {
    const total = contacts.length;
    const withEmail = contacts.filter(c => c.email && c.email.trim() !== '' && c.email !== '-').length;
    const withPhone = contacts.filter(c => c.phone && c.phone.trim() !== '' && c.phone !== '-').length;
    
    // Unique Orgs
    const orgs = new Set(contacts.map(c => c.organization).filter(o => o));
    
    // Type Data
    const typeCount: Record<string, number> = {};
    contacts.forEach(c => {
      const type = c.type || 'ไม่ระบุ';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const typeData = Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Province Data
    const provinceCount: Record<string, number> = {};
    contacts.forEach(c => {
      const prov = c.address.province || 'ไม่ระบุ';
      provinceCount[prov] = (provinceCount[prov] || 0) + 1;
    });
    const provinceData = Object.entries(provinceCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10

    // Org Data
    const orgCount: Record<string, number> = {};
    contacts.forEach(c => {
      const org = c.organization || 'ไม่ระบุ';
      orgCount[org] = (orgCount[org] || 0) + 1;
    });
    const topOrgs = Object.entries(orgCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      total,
      withEmail,
      withPhone,
      uniqueOrgs: orgs.size,
      typeData,
      provinceData,
      topOrgs
    };
  }, [contacts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-primary mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">ผู้ติดต่อทั้งหมด</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-orange-50 text-orange-600 mr-4">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">หน่วยงาน</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.uniqueOrgs}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">มีอีเมล</p>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold text-gray-800">{stats.withEmail}</h3>
              <span className="text-xs text-gray-400 ml-2">({Math.round((stats.withEmail/Math.max(stats.total, 1))*100)}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
            <Phone size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">มีเบอร์โทรศัพท์</p>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold text-gray-800">{stats.withPhone}</h3>
              <span className="text-xs text-gray-400 ml-2">({Math.round((stats.withPhone/Math.max(stats.total, 1))*100)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Type Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
             <Database className="mr-2 text-primary" size={20} />
             สัดส่วนประเภทสื่อ
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'จำนวน']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Province Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
             <MapPin className="mr-2 text-primary" size={20} />
             จังหวัดยอดนิยม (Top 10)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.provinceData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#0f4c81" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.provinceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#0f4c81' : '#94a3b8'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Organizations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
             <Building2 className="mr-2 text-primary" size={20} />
             หน่วยงานที่มีผู้ติดต่อมากที่สุด
          </h3>
          <div className="space-y-4">
            {stats.topOrgs.map((org, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                            {idx + 1}
                        </div>
                        <span className="font-medium text-gray-700">{org.name}</span>
                    </div>
                    <span className="font-bold text-primary">{org.value} คน</span>
                </div>
            ))}
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">คุณภาพข้อมูล</h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">ความครบถ้วนของเบอร์โทรศัพท์</span>
                        <span className="font-medium text-gray-900">{Math.round((stats.withPhone/Math.max(stats.total, 1))*100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(stats.withPhone/Math.max(stats.total, 1))*100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">ความครบถ้วนของอีเมล</span>
                        <span className="font-medium text-gray-900">{Math.round((stats.withEmail/Math.max(stats.total, 1))*100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(stats.withEmail/Math.max(stats.total, 1))*100}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p>การมีข้อมูลที่ครบถ้วนช่วยให้การติดต่อสื่อสารมีประสิทธิภาพมากยิ่งขึ้น ควรตรวจสอบและปรับปรุงข้อมูลให้เป็นปัจจุบันอยู่เสมอ</p>
            </div>
        </div>
      </div>
    </div>
  );
};