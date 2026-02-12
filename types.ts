export interface Contact {
  id: string;
  name: string; // ชื่อ-นามสกุล
  type: string; // ประเภทของข้อมูล
  position: string; // ตำแหน่ง
  organization: string; // หน่วยงาน
  phone: string; // เบอร์โทรศัพท์
  email: string; // e-mail
  address: {
    no: string; // เลขที่
    soi: string; // ซอย
    moo: string; // หมู่ที่
    road: string; // ถนน
    subdistrict: string; // ตำบล/แขวง
    district: string; // อำเภอ/เขต
    province: string; // จังหวัด
    zipcode: string; // รหัสไปรษณีย์
  };
  link: string; // LINK
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for display, required for auth/creation
  name: string;
  role: UserRole;
}

export type ViewState = 'dashboard' | 'add' | 'categories' | 'analytics' | 'details' | 'users';

export type UserRole = 'viewer' | 'editor' | 'admin';