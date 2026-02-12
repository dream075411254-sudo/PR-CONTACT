import { Contact, Category, User, UserRole, ActivityLog } from '../types';
import { DEFAULT_CATEGORIES, API_ENDPOINT } from '../constants';

const CATEGORIES_KEY = 'pr_categories_data';
const USERS_KEY = 'pr_users_data';
const LOGS_KEY = 'pr_activity_logs';

// Default Admin remains for initial access
const DEFAULT_ADMIN: User = { 
  id: '1', 
  username: 'Urassayawan.je', 
  password: 'Mira.237', 
  name: 'System Admin', 
  role: 'admin' 
};

// --- Utils ---
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Activity Log Logic (Still Local for Performance, could be synced later if needed) ---

export const logActivity = (actor: User | null, action: string, details: string) => {
  if (!actor) return;
  try {
    const logsData = localStorage.getItem(LOGS_KEY);
    const logs: ActivityLog[] = logsData ? JSON.parse(logsData) : [];
    const newLog: ActivityLog = {
      id: generateUUID(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: action,
      details: details,
      timestamp: Date.now()
    };
    const updatedLogs = [newLog, ...logs].slice(0, 500);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to save log", error);
  }
};

export const getActivityLogs = (): ActivityLog[] => {
  try {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const clearActivityLogs = (): void => {
  localStorage.removeItem(LOGS_KEY);
};

// --- Contact Logic ---

const mapRowToContact = (row: any): Contact => ({
  id: String(row.rowId),
  name: row['ชื่อ-นามสกุล'] || '',
  type: row['ประเภทของข้อมูล'] || 'Uncategorized',
  position: row['ตำแหน่ง'] || '',
  organization: row['หน่วยงาน'] || '',
  phone: row['เบอร์โทรศัพท์'] || '',
  email: row['e-mail'] || '',
  address: {
    no: row['เลขที่'] || '',
    soi: row['ซอย'] || '',
    moo: row['หมู่ที่'] || '',
    road: row['ถนน'] || '',
    subdistrict: row['ตำบล/แขวง'] || '',
    district: row['อำเภอ/เขต'] || '',
    province: row['จังหวัด'] || '',
    zipcode: row['รหัสไปรษณีย์'] || ''
  },
  link: row['LINK'] || '',
  createdAt: Date.now()
});

const mapContactToRow = (contact: Contact) => ({
  'ชื่อ-นามสกุล': contact.name,
  'ประเภทของข้อมูล': contact.type,
  'ตำแหน่ง': contact.position,
  'หน่วยงาน': contact.organization,
  'เบอร์โทรศัพท์': contact.phone,
  'e-mail': contact.email,
  'เลขที่': contact.address.no,
  'ซอย': contact.address.soi,
  'หมู่ที่': contact.address.moo,
  'ถนน': contact.address.road,
  'ตำบล/แขวง': contact.address.subdistrict,
  'อำเภอ/เขต': contact.address.district,
  'จังหวัด': contact.address.province,
  'รหัสไปรษณีย์': contact.address.zipcode,
  'LINK': contact.link
});

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await fetch(`${API_ENDPOINT}?action=getContacts&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const rows = result.data || (Array.isArray(result) ? result : []);
    return rows.map((row: any) => mapRowToContact(row)).reverse(); 
  } catch (error) {
    console.error("Error loading contacts", error);
    return [];
  }
};

export const saveContact = async (contact: Contact, actor: User): Promise<boolean> => {
  try {
    const isUpdate = !isNaN(Number(contact.id));
    const rowData = mapContactToRow(contact);
    const payload = {
      action: isUpdate ? 'update' : 'create',
      rowId: isUpdate ? contact.id : undefined,
      ...rowData
    };
    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });
    logActivity(actor, isUpdate ? 'แก้ไขข้อมูลติดต่อ' : 'เพิ่มข้อมูลติดต่อ', `ชื่อ: ${contact.name}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteContact = async (id: string, contactName: string, actor: User): Promise<void> => {
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'delete', rowId: id })
    });
    logActivity(actor, 'ลบข้อมูลติดต่อ', `ลบรายชื่อ: ${contactName}`);
  } catch (error) {}
};

// --- User Management Logic (Synced to Cloud) ---

export const getUsers = async (): Promise<User[]> => {
  try {
    // Try to fetch users from the Google Script
    const response = await fetch(`${API_ENDPOINT}?action=getUsers&t=${Date.now()}`);
    if (!response.ok) throw new Error();
    const result = await response.json();
    const cloudUsers = result.data || [];
    
    // Always include the default admin to prevent lockout
    const allUsers = [DEFAULT_ADMIN, ...cloudUsers.filter((u: User) => u.username !== DEFAULT_ADMIN.username)];
    return allUsers;
  } catch (error) {
    // Fallback to localStorage and Default Admin if API fails
    const localData = localStorage.getItem(USERS_KEY);
    const localUsers = localData ? JSON.parse(localData) : [DEFAULT_ADMIN];
    return localUsers;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  const users = await getUsers();
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();
  
  const user = users.find(u => 
    u.username.toLowerCase() === cleanUsername && 
    u.password === cleanPassword
  );
  return user || null;
};

export const saveUser = async (user: User, actor: User): Promise<void> => {
  try {
    // Save to Cloud
    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'saveUser',
        userData: user
      })
    });
    
    // Also update local for immediate feedback
    const users = await getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    logActivity(actor, 'จัดการผู้ใช้งาน', `บันทึกผู้ใช้: ${user.name}`);
  } catch (error) {
    throw new Error("ไม่สามารถบันทึกข้อมูลผู้ใช้ไปยัง Cloud ได้");
  }
};

export const deleteUser = async (id: string, actor: User): Promise<void> => {
  if (id === '1' || id === DEFAULT_ADMIN.id) throw new Error("ไม่สามารถลบ Admin หลักได้");

  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'deleteUser',
        rowId: id
      })
    });

    const users = await getUsers();
    const newUsers = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    
    logActivity(actor, 'ลบผู้ใช้งาน', `ลบผู้ใช้ ID: ${id}`);
  } catch (error) {
    throw new Error("ไม่สามารถลบข้อมูลผู้ใช้ออกจาก Cloud ได้");
  }
};

// --- Category Logic ---

export const getCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      const defaults = DEFAULT_CATEGORIES.map(c => ({ id: generateUUID(), name: c }));
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  } catch (error) { return []; }
};

export const syncCategoriesFromData = (contacts: Contact[]): void => {
  const currentCats = getCategories();
  const existingNames = new Set(currentCats.map(c => c.name));
  let hasNew = false;
  contacts.forEach(c => {
    if (c.type && !existingNames.has(c.type)) {
      currentCats.push({ id: generateUUID(), name: c.type });
      existingNames.add(c.type);
      hasNew = true;
    }
  });
  if (hasNew) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(currentCats));
};

export const addCategory = (name: string, actor: User): Category => {
  const categories = getCategories();
  const newCat = { id: generateUUID(), name };
  categories.push(newCat);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  logActivity(actor, 'เพิ่มหมวดหมู่', `หมวดหมู่: ${name}`);
  return newCat;
};

export const deleteCategory = (id: string, name: string, actor: User): void => {
  const categories = getCategories();
  const newCats = categories.filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCats));
  logActivity(actor, 'ลบหมวดหมู่', `หมวดหมู่: ${name}`);
};

export const exportToCSV = (contacts: Contact[], actor: User): string => {
  const headers = ["ชื่อ-นามสกุล", "ประเภทของข้อมูล", "ตำแหน่ง", "หน่วยงาน", "เบอร์โทรศัพท์", "e-mail", "เลขที่", "ซอย", "หมู่ที่", "ถนน", "ตำบล/แขวง", "อำเภอ/เขต", "จังหวัด", "รหัสไปรษณีย์", "LINK"];
  const rows = contacts.map(c => [c.name, c.type, c.position, c.organization, c.phone, c.email, c.address.no, c.address.soi, c.address.moo, c.address.road, c.address.subdistrict, c.address.district, c.address.province, c.address.zipcode, c.link]);
  const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(","))].join("\n");
  logActivity(actor, 'Export ข้อมูล', 'ดาวน์โหลดไฟล์ CSV');
  return csvContent;
};