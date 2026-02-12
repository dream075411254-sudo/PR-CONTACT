import { Contact, Category } from '../types';
import { DEFAULT_CATEGORIES, API_ENDPOINT } from '../constants';

const CATEGORIES_KEY = 'pr_categories_data';

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
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      redirect: 'follow',
      credentials: 'omit' 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Check if result is array or object with data property
    // The new script returns { status: 'success', data: [...] }
    const rows = result.data || (Array.isArray(result) ? result : []);
    
    // Map and then reverse to show newest first, but keep the ID intact
    return rows.map((row: any) => mapRowToContact(row)).reverse(); 
  } catch (error) {
    console.error("Error loading contacts from API", error);
    return [];
  }
};

export const saveContact = async (contact: Contact): Promise<boolean> => {
  try {
    // Check if we are updating (numeric ID from sheet) or creating (UUID)
    const isUpdate = !isNaN(Number(contact.id));
    const rowData = mapContactToRow(contact);

    const payload = {
      action: isUpdate ? 'update' : 'create',
      rowId: isUpdate ? contact.id : undefined,
      ...rowData, // For create (flat structure support)
      data: rowData // For update (nested data structure support)
    };
    
    // Support compatibility with both old/simple scripts (flat) and new scripts (nested data)
    // The new script uses 'data' key for update, and flat keys or data key for create.
    // We send flattened keys as well for 'create' to be safe.
    const finalPayload = isUpdate ? payload : { ...payload, ...rowData };

    await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(finalPayload)
    });
    
    return true;
  } catch (error) {
    console.error("Error saving contact", error);
    return false;
  }
};

export const deleteContact = async (id: string): Promise<void> => {
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
  } catch (error) {
    console.error("Error deleting contact", error);
    throw error;
  }
};

export const getCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      const defaults = DEFAULT_CATEGORIES.map(c => ({ id: crypto.randomUUID(), name: c }));
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
      currentCats.push({ id: crypto.randomUUID(), name: c.type });
      existingNames.add(c.type);
      hasNew = true;
    }
  });

  if (hasNew) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(currentCats));
  }
};

export const addCategory = (name: string): Category => {
  const categories = getCategories();
  const newCat = { id: crypto.randomUUID(), name };
  categories.push(newCat);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return newCat;
};

export const deleteCategory = (id: string): void => {
  const categories = getCategories();
  const newCats = categories.filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCats));
};

export const exportToCSV = (contacts: Contact[]): string => {
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

  return csvContent;
};