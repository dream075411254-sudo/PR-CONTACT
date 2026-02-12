import React, { useState } from 'react';
import { Category } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Trash2, Plus, Tag } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd, onDelete }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAdd(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg text-primary">
          <Tag size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">จัดการหมวดหมู่ข้อมูล</h2>
          <p className="text-sm text-gray-500">เพิ่มหรือลบประเภทของข้อมูลสื่อมวลชน</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input 
          placeholder="ชื่อหมวดหมู่ใหม่..." 
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!newCategory.trim()}>
          <Plus size={18} className="mr-2" />
          เพิ่ม
        </Button>
      </form>

      <div className="space-y-2">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
          >
            <span className="font-medium text-gray-700">{category.name}</span>
            <button 
              onClick={() => onDelete(category.id)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="ลบ"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            ยังไม่มีหมวดหมู่
          </div>
        )}
      </div>
    </div>
  );
};