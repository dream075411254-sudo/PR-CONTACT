import React, { useState, useEffect, useMemo } from 'react';
import { Contact, Category, ViewState, UserRole } from './types';
import * as DataService from './services/dataService';
import { ContactForm } from './components/ContactForm';
import { CategoryManager } from './components/CategoryManager';
import { Stats } from './components/Stats';
import { ContactDetail } from './components/ContactDetail';
import { Button } from './components/Button';
import { LoginScreen } from './components/LoginScreen';
import { UserManager } from './components/UserManager';
import { GOOGLE_SHEET_URL } from './constants';
import { 
  LayoutDashboard, 
  Plus, 
  Users, 
  Settings, 
  Search, 
  Download, 
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  PieChart,
  RefreshCw,
  LayoutList,
  LayoutGrid,
  Eye,
  Menu,
  X,
  LogOut,
  Shield,
  ShieldCheck,
  Lock,
  UserCog
} from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  const [view, setView] = useState<ViewState>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); 
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Permission Checks
  const canManageContacts = userRole === 'editor' || userRole === 'admin';
  const canManageSystem = userRole === 'admin';

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getContacts();
      setContacts(data);
      
      // Update categories based on actual data
      DataService.syncCategoriesFromData(data);
      setCategories(DataService.getCategories());
    } catch (error) {
      console.error("Failed to fetch contacts", error);
      alert("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Check Local Storage for Auth
  useEffect(() => {
    const savedRole = localStorage.getItem('pr_app_role') as UserRole | null;
    if (savedRole) {
      setUserRole(savedRole);
      setIsAuthenticated(true);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Ensure we load data whenever authentication is confirmed
      fetchContacts();
      setCategories(DataService.getCategories());
    }
  }, [isAuthenticated]);

  // Close sidebar when view changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [view]);

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    // Reset view to dashboard when logging in
    setView('dashboard');
    
    // Persist login state for all roles
    localStorage.setItem('pr_app_role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('viewer');
    localStorage.removeItem('pr_app_role');
    setView('dashboard');
    setViewingContact(null);
    setEditingContact(null);
    setContacts([]); // Clear contacts on logout
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.address.province.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategoryFilter === 'all' || contact.type === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [contacts, searchTerm, selectedCategoryFilter]);

  const handleSaveContact = async (contact: Contact) => {
    if (!canManageContacts) return;
    setIsSaving(true);
    try {
      await DataService.saveContact(contact);
      setTimeout(async () => {
          await fetchContacts();
      }, 1500);
      
      setView('dashboard');
      setEditingContact(null);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!canManageContacts) return;
    if (confirm('ยืนยันการลบข้อมูลนี้? (การลบจะส่งผลต่อฐานข้อมูลโดยตรง)')) {
      setIsLoading(true);
      try {
        await DataService.deleteContact(id);
        setTimeout(async () => {
             await fetchContacts();
        }, 1500);

      } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        setIsLoading(false);
      }
    }
  };

  const handleEditContact = (contact: Contact) => {
     if (!canManageContacts) return;
     setEditingContact(contact);
     setView('add');
  };

  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact);
    setView('details');
  };

  const handleAddCategory = (name: string) => {
    if (!canManageSystem) return;
    DataService.addCategory(name);
    setCategories(DataService.getCategories());
  };

  const handleDeleteCategory = (id: string) => {
    if (!canManageSystem) return;
    if (confirm('ยืนยันการลบหมวดหมู่?')) {
      DataService.deleteCategory(id);
      setCategories(DataService.getCategories());
    }
  };

  const handleExportCSV = () => {
    const csvContent = DataService.exportToCSV(contacts);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pr_contacts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER LOGIN SCREEN ---
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-blue-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PR Manager</h1>
            <div className="flex items-center gap-2 mt-2 text-blue-200 text-sm bg-blue-800/50 py-1 px-2 rounded-md w-fit">
                {userRole === 'admin' ? <Lock size={14} className="text-red-300" /> : 
                 userRole === 'editor' ? <ShieldCheck size={14} className="text-orange-300" /> : 
                 <Shield size={14} className="text-green-300" />}
                <span className="capitalize">{userRole}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-blue-200 hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <button 
            onClick={() => { setView('dashboard'); setViewingContact(null); }}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'dashboard' || view === 'details' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            <LayoutDashboard size={20} className="mr-3" />
            <span>รายชื่อผู้ติดต่อ</span>
          </button>
          
          <button 
            onClick={() => setView('analytics')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'analytics' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            <PieChart size={20} className="mr-3" />
            <span>ภาพรวมข้อมูล</span>
          </button>

          {/* Contact Management (Editor & Admin) */}
          {canManageContacts && (
            <>
                <div className="pt-4 pb-2 px-3 text-xs uppercase text-blue-300 font-semibold tracking-wider">
                    จัดการข้อมูล
                </div>
                <button 
                    onClick={() => { setEditingContact(null); setView('add'); }}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'add' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                >
                    <Plus size={20} className="mr-3" />
                    <span>เพิ่มข้อมูล</span>
                </button>
            </>
          )}

          {/* System Settings (Admin Only) */}
          {canManageSystem && (
             <>
                <div className="pt-4 pb-2 px-3 text-xs uppercase text-blue-300 font-semibold tracking-wider">
                    ผู้ดูแลระบบ
                </div>
                <button 
                    onClick={() => setView('categories')}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'categories' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                >
                    <Settings size={20} className="mr-3" />
                    <span>จัดการหมวดหมู่</span>
                </button>
                <button 
                    onClick={() => setView('users')}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'users' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                >
                    <UserCog size={20} className="mr-3" />
                    <span>จัดการผู้ใช้งาน</span>
                </button>
             </>
          )}
        </nav>
        
        <div className="p-4 mt-auto border-t border-blue-800 space-y-2">
           <button 
                onClick={handleLogout}
                className="w-full flex items-center p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
            >
                <LogOut size={20} className="mr-3" />
                <span>ออกจากระบบ</span>
            </button>

          {/* Link visible to Editor and Admin */}
          {(canManageContacts) && (
            <a 
              href={GOOGLE_SHEET_URL} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center p-2 text-sm text-blue-200 hover:text-white transition-colors"
            >
              <ExternalLink size={16} className="mr-2" />
              เปิด Google Sheet
            </a>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0 z-30">
           <div className="font-bold text-gray-700 flex items-center gap-2">
              <Users size={20} className="text-primary"/>
              <span>PR Manager</span>
           </div>
           <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
           >
              <Menu size={24} />
           </button>
        </header>

        {/* Loading Overlay */}
        {(isLoading || isSaving) && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">
                {isSaving ? 'กำลังบันทึกข้อมูล...' : 'กำลังโหลดข้อมูล...'}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          
          {view === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">รายชื่อผู้ติดต่อทั้งหมด</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={fetchContacts} title="อัปเดตข้อมูล">
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                  </Button>
                  <Button variant="secondary" onClick={handleExportCSV}>
                    <Download size={18} className="mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  {canManageContacts && (
                    <Button onClick={() => { setEditingContact(null); setView('add'); }}>
                        <Plus size={18} className="mr-2" />
                        เพิ่มข้อมูล
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters and View Toggle */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 flex-1 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="ค้นหา ชื่อ, หน่วยงาน..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="p-2 border border-gray-300 rounded-lg bg-white w-full md:w-auto md:min-w-[200px]"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0 h-[58px] items-center">
                   <button 
                      onClick={() => setViewMode('table')}
                      className={`p-2.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                      title="มุมมองตาราง"
                   >
                      <LayoutList size={22} />
                   </button>
                   <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                      title="มุมมองการ์ด"
                   >
                      <LayoutGrid size={22} />
                   </button>
                </div>
              </div>

              {/* Content Display */}
              {viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts.map((contact, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">
                            {contact.type}
                          </span>
                          <div className="flex space-x-1">
                            <button onClick={() => handleViewContact(contact)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="ดูรายละเอียด">
                              <Eye size={16} />
                            </button>
                            {canManageContacts && (
                                <>
                                    <button onClick={() => handleEditContact(contact)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="แก้ไข">
                                    <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteContact(contact.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="ลบ">
                                    <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{contact.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{contact.position} @ {contact.organization}</p>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {contact.phone || '-'}
                          </div>
                          <div className="flex items-center">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            <span className="truncate">{contact.email || '-'}</span>
                          </div>
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">
                              {[contact.address.subdistrict, contact.address.district, contact.address.province].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                          <button 
                              onClick={() => handleViewContact(contact)}
                              className="flex-1 py-3 text-center text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors active:bg-gray-100"
                          >
                              ดูข้อมูล
                          </button>
                          {contact.link && (
                          <a 
                              href={contact.link.startsWith('http') ? contact.link : `https://${contact.link}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex-1 py-3 text-center text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors active:bg-blue-100"
                          >
                              เยี่ยมชมเว็บ
                          </a>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // TABLE VIEW
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                          ชื่อ-นามสกุล
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ประเภท
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                          ตำแหน่ง/หน่วยงาน
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                          ติดต่อ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จังหวัด
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">{contact.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {contact.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{contact.position}</div>
                            <div className="text-sm text-gray-500">{contact.organization}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center gap-1.5 mb-1">
                              <Phone size={14} className="text-gray-400 flex-shrink-0" />
                              {contact.phone || '-'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.email || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contact.address.province}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3">
                                {contact.link && (
                                  <a 
                                    href={contact.link.startsWith('http') ? contact.link : `https://${contact.link}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="เยี่ยมชมเว็บไซต์"
                                  >
                                    <ExternalLink size={18} />
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleViewContact(contact)} 
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="ดูรายละเอียด"
                                >
                                  <Eye size={18}/>
                                </button>
                                {canManageContacts && (
                                    <>
                                        <button 
                                            onClick={() => handleEditContact(contact)} 
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Edit size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteContact(contact.id)} 
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="ลบ"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!isLoading && filteredContacts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  <Users size={48} className="mx-auto mb-3 opacity-20" />
                  <p>ไม่พบข้อมูลผู้ติดต่อ</p>
                </div>
              )}

              {!isLoading && filteredContacts.length === 0 && canManageContacts && (
                 <div className="text-left">
                    <a 
                      href={GOOGLE_SHEET_URL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline text-base"
                    >
                      ข้อมูลจากGoogle Sheet ยังไม่แสดง
                    </a>
                 </div>
              )}

            </div>
          )}

          {view === 'add' && (
            <ContactForm 
              categories={categories} 
              onSave={handleSaveContact} 
              onCancel={() => { setView('dashboard'); setEditingContact(null); }}
              initialData={editingContact}
            />
          )}

          {view === 'categories' && (
            <CategoryManager 
              categories={categories} 
              onAdd={handleAddCategory} 
              onDelete={handleDeleteCategory} 
            />
          )}

          {view === 'users' && (
             <UserManager />
          )}

          {view === 'analytics' && (
            <Stats contacts={contacts} />
          )}

          {view === 'details' && viewingContact && (
             <ContactDetail 
                contact={viewingContact}
                onBack={() => { setView('dashboard'); setViewingContact(null); }}
                onEdit={(c) => { handleEditContact(c); }}
                onDelete={(id) => { handleDeleteContact(id); setView('dashboard'); }}
                readOnly={!canManageContacts}
             />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;