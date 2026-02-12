import { Contact, Category, User, UserRole, ActivityLog } from '../types';
import { DEFAULT_CATEGORIES, API_ENDPOINT } from '../constants';

const CATEGORIES_KEY = 'pr_categories_data';
const USERS_KEY = 'pr_users_data';
const LOGS_KEY = 'pr_activity_logs';

// --- Utils ---
export const generateUUID = () => {
  // Fallback for environments where crypto is not available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Activity Log Logic ---

export const logActivity = (actor: User | null, action: string, details: string) => {
  if (!actor) return; // Don't log if no user context (shouldn't happen in app usage)

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

    // Keep only last 500 logs to prevent localStorage overflow
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

// Helper to map API response (Thai headers) to Contact interface
const mapRowToContact = (row: any): Contact => {
  return {
    id: String(row.rowId), // Use the actual Sheet Row ID provided by the Script
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
  };
};

// Helper to map Contact interface to API payload (Thai headers)
const mapContactToRow = (contact: Contact) => {
  return {
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
  };
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    // Add cache buster timestamp
    const response = await fetch(`${API_ENDPOINT}?t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow',
      credentials: 'omit' 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Check if result is array or object with data property
    const rows = result.data || (Array.isArray(result) ? result : []);
    
    // Map and then reverse to show newest first
    return rows.map((row: any) => mapRowToContact(row)).reverse(); 
  } catch (error) {
    console.error("Error loading contacts from API", error);
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
      ...rowData, 
      data: rowData 
    };
    
    const finalPayload = isUpdate ? payload : { ...payload, ...rowData };

    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(finalPayload)
    });

    logActivity(actor, isUpdate ? 'แก้ไขข้อมูลติดต่อ' : 'เพิ่มข้อมูลติดต่อ', `ชื่อ: ${contact.name}, หน่วยงาน: ${contact.organization}`);
    
    return true;
  } catch (error) {
    console.error("Error saving contact", error);
    return false;
  }
};

export const deleteContact = async (id: string, contactName: string, actor: User): Promise<void> => {
  try {
    const payload = {
      action: 'delete',
      rowId: id
    };

    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    logActivity(actor, 'ลบข้อมูลติดต่อ', `ลบรายชื่อ: ${contactName} (ID: ${id})`);
  } catch (error) {
    console.error("Error deleting contact", error);
    throw error;
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
  } catch (error) {
    return [];
  }
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

  if (hasNew) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(currentCats));
  }
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
  const headers = [
    "ชื่อ-นามสกุล", "ประเภทของข้อมูล", "ตำแหน่ง", "หน่วยงาน", "เบอร์โทรศัพท์", 
    "e-mail", "เลขที่", "ซอย", "หมู่ที่", "ถนน", 
    "ตำบล/แขวง", "อำเภอ/เขต", "จังหวัด", "รหัสไปรษณีย์", "LINK"
  ];

  const rows = contacts.map(c => [
    c.name,
    c.type,
    c.position,
    c.organization,
    c.phone,
    c.email,
    c.address.no,
    c.address.soi,
    c.address.moo,
    c.address.road,
    c.address.subdistrict,
    c.address.district,
    c.address.province,
    c.address.zipcode,
    c.link
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  logActivity(actor, 'Export ข้อมูล', 'ดาวน์โหลดไฟล์ CSV');
  return csvContent;
};

// --- User Management Logic ---

// Only Admin exists by default. Other roles must be created by Admin.
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin123', name: 'System Admin', role: 'admin' }
];

export const getUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch (error) {
    return DEFAULT_USERS;
  }
};

export const authenticateUser = (username: string, password: string): User | null => {
  const users = getUsers();
  // Case-insensitive, trimmed username match. Password is still exact.
  const cleanUsername = username.trim().toLowerCase();
  
  const user = users.find(u => 
    u.username.toLowerCase() === cleanUsername && 
    u.password === password
  );
  return user || null;
};

export const saveUser = (user: User, actor: User): void => {
  const users = getUsers();
  
  // Check for duplicate username (excluding the user being edited)
  const duplicate = users.find(u => 
    u.username.toLowerCase() === user.username.trim().toLowerCase() && 
    u.id !== user.id
  );

  if (duplicate) {
    throw new Error(`ชื่อผู้ใช้ "${user.username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
  }

  const index = users.findIndex(u => u.id === user.id);
  let actionDetails = '';

  if (index >= 0) {
    // Update existing
    users[index] = user;
    actionDetails = `แก้ไขผู้ใช้: ${user.name} (${user.role})`;
  } else {
    // Add new
    users.push(user);
    actionDetails = `เพิ่มผู้ใช้ใหม่: ${user.name} (${user.role})`;
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  logActivity(actor, 'จัดการผู้ใช้งาน', actionDetails);
};

export const deleteUser = (id: string, actor: User): void => {
  const users = getUsers();
  // Prevent deleting the last admin
  const userToDelete = users.find(u => u.id === id);
  if (userToDelete?.role === 'admin') {
     const adminCount = users.filter(u => u.role === 'admin').length;
     if (adminCount <= 1) {
         throw new Error("ไม่สามารถลบ Admin คนสุดท้ายได้");
     }
  }

  if (userToDelete) {
      const newUsers = users.filter(u => u.id !== id);
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      logActivity(actor, 'ลบผู้ใช้งาน', `ลบผู้ใช้: ${userToDelete.name}`);
  }
};