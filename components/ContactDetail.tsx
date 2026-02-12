import React from 'react';
import { Contact } from '../types';
import { Button } from './Button';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Globe, Building2, User } from 'lucide-react';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ contact, onBack, onEdit, onDelete, readOnly = false }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-primary/5 p-6 border-b border-primary/10 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm text-primary flex-shrink-0">
            <User size={32} />
          </div>
          <div>
             <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
             <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {contact.type}
                </span>
                <span>{contact.position}</span>
             </div>
             <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <Building2 size={14} />
                {contact.organization}
             </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="secondary" onClick={onBack} size="sm" className="flex-1 md:flex-none">
                <ArrowLeft size={18} className="mr-1"/> ย้อนกลับ
            </Button>
            {!readOnly && (
              <>
                <Button variant="secondary" onClick={() => onEdit(contact)} size="sm" className="flex-1 md:flex-none">
                    <Edit size={18} className="mr-1"/> แก้ไข
                </Button>
                <Button variant="danger" onClick={() => onDelete(contact.id)} size="sm" className="flex-1 md:flex-none">
                    <Trash2 size={18} className="mr-1"/> ลบ
                </Button>
              </>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Contact Info */}
         <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ข้อมูลติดต่อ</h3>
            
            <div className="flex items-start gap-3 group">
                <div className="mt-1 p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                    <Phone size={20} />
                </div>
                <div>
                    <label className="block text-sm text-gray-500">เบอร์โทรศัพท์</label>
                    <p className="text-gray-900 font-medium text-lg">{contact.phone || '-'}</p>
                </div>
            </div>

            <div className="flex items-start gap-3 group">
                <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Mail size={20} />
                </div>
                <div>
                    <label className="block text-sm text-gray-500">อีเมล</label>
                    <p className="text-gray-900 font-medium text-lg break-all">{contact.email || '-'}</p>
                </div>
            </div>

            <div className="flex items-start gap-3 group">
                <div className="mt-1 p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Globe size={20} />
                </div>
                <div>
                    <label className="block text-sm text-gray-500">เว็บไซต์ / ลิงก์</label>
                     {contact.link ? (
                      <a 
                        href={contact.link.startsWith('http') ? contact.link : `https://${contact.link}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium break-all"
                      >
                        {contact.link}
                      </a>
                    ) : (
                        <p className="text-gray-900">-</p>
                    )}
                </div>
            </div>
         </div>

         {/* Address */}
         <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ที่อยู่</h3>
             <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <MapPin size={20} />
                </div>
                <div className="text-gray-700 leading-relaxed grid grid-cols-1 gap-1 w-full">
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">เลขที่:</span> <span>{contact.address.no || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">หมู่ที่:</span> <span>{contact.address.moo || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">ซอย:</span> <span>{contact.address.soi || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">ถนน:</span> <span>{contact.address.road || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">แขวง/ตำบล:</span> <span>{contact.address.subdistrict || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">เขต/อำเภอ:</span> <span>{contact.address.district || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">จังหวัด:</span> <span>{contact.address.province || '-'}</span></div>
                   <div className="flex"><span className="text-gray-500 w-24 flex-shrink-0">รหัสปณ.:</span> <span>{contact.address.zipcode || '-'}</span></div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};