import React, { useState, useEffect } from 'react';
import { Contact, Category } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Save, X } from 'lucide-react';
import * as DataService from '../services/dataService';

interface ContactFormProps {
  initialData?: Contact | null;
  categories: Category[];
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ initialData, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Contact>({
    id: DataService.generateUUID(),
    name: '',
    type: categories[0]?.name || '',
    position: '',
    organization: '',
    phone: '',
    email: '',
    address: {
      no: '', soi: '', moo: '', road: '', subdistrict: '', district: '', province: '', zipcode: ''
    },
    link: '',
    createdAt: Date.now()
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (categories.length > 0) {
        setFormData(prev => ({ ...prev, type: categories[0].name }));
    }
  }, [initialData, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">
          {initialData ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ข้อมูลทั่วไป</h3>
          <Input 
            label="ชื่อ-นามสกุล" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            placeholder="เช่น นายสมชาย ใจดี"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทของข้อมูล</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <Input label="ตำแหน่ง" name="position" value={formData.position} onChange={handleChange} />
          <Input label="หน่วยงาน" name="organization" value={formData.organization} onChange={handleChange} />
          <Input label="เบอร์โทรศัพท์" name="phone" value={formData.phone} onChange={handleChange} />
          <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} />
          <Input label="LINK (URL)" name="link" value={formData.link} onChange={handleChange} placeholder="https://..." />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ที่อยู่</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="เลขที่" name="address.no" value={formData.address.no} onChange={handleChange} />
            <Input label="หมู่ที่" name="address.moo" value={formData.address.moo} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ซอย" name="address.soi" value={formData.address.soi} onChange={handleChange} />
            <Input label="ถนน" name="address.road" value={formData.address.road} onChange={handleChange} />
          </div>
          <Input label="ตำบล/แขวง" name="address.subdistrict" value={formData.address.subdistrict} onChange={handleChange} />
          <Input label="อำเภอ/เขต" name="address.district" value={formData.address.district} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="จังหวัด" name="address.province" value={formData.address.province} onChange={handleChange} />
            <Input label="รหัสไปรษณีย์" name="address.zipcode" value={formData.address.zipcode} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>ยกเลิก</Button>
        <Button type="submit" variant="primary">
          <Save className="w-4 h-4 mr-2" />
          บันทึกข้อมูล
        </Button>
      </div>
    </form>
  );
};