
import React, { useState, useEffect, useCallback, useContext } from 'react';
import type { Personnel } from '../types';
import { DatabaseService } from '../services/databaseService';
import PersonnelTable from '../components/PersonnelTable';
import PersonnelDetails from '../components/PersonnelDetails';
import LeaveTracker from '../components/LeaveTracker';
import TimeLogTracker from '../components/TimeLogTracker';
import Reporting from '../components/Reporting';
import UserManagementScreen from './UserManagementScreen';
import DeviceIntegration from '../components/DeviceIntegration';
import DocumentGenerator from '../components/DocumentGenerator';
import Dashboard from '../components/Dashboard';
import CompensationCalculator from '../components/CompensationCalculator';
import AIAssistant from '../components/AIAssistant';
import AuditLogs from '../components/AuditLogs';
import LeaveManagement from '../components/LeaveManagement';
import { AppContext } from '../contexts/AppContext';

// Dummy object for creating new personnel
const NEW_PERSONNEL_TEMPLATE: Personnel = {
    id: 'NEW',
    sicilNo: '',
    adSoyad: '',
    gorevi: '',
    leaves: [],
    timeLogs: [],
    bonuses: [],
    deductions: [],
    documents: [],
    baseSalary: 0,
    hourlyRate: 0
};

const MainScreen: React.FC = () => {
    const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
    const [allPersonnelForReport, setAllPersonnelForReport] = useState<Personnel[]>([]);
    const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [showDeviceIntegration, setShowDeviceIntegration] = useState(false);
    const [showDocGenerator, setShowDocGenerator] = useState(false);
    const [showCompensationCalc, setShowCompensationCalc] = useState(false);
    const [showAuditLogs, setShowAuditLogs] = useState(false);
    const [showLeaveManagement, setShowLeaveManagement] = useState(false);
    const [showLateNotification, setShowLateNotification] = useState(false);
    const [lateCount, setLateCount] = useState(0);

    // UI State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'personnel'>('dashboard');
    const { currentUser, logout } = useContext(AppContext);

    const loadPersonnel = useCallback(() => {
        const allData = DatabaseService.getPersonnel();
        
        if (currentUser?.role === 'admin') {
            setAllPersonnelForReport(allData);
            setPersonnelList(allData);
        } 
        else if (currentUser?.role === 'user' && currentUser.personnelId) {
            const myData = allData.filter(p => p.id === currentUser.personnelId);
            setAllPersonnelForReport([]); 
            setPersonnelList(myData);
            if (myData.length > 0) {
                setSelectedPersonnel(myData[0]);
                setActiveTab('personnel'); 
            }
        }
    }, [currentUser]);

    useEffect(() => {
        loadPersonnel();
    }, [loadPersonnel]);

    // Late Arrival Check
    useEffect(() => {
        if (currentUser?.role !== 'admin') return;

        const checkLate = () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            // Check only if it's past 08:45
            if (hour > 8 || (hour === 8 && minute >= 45)) {
                const todayStr = now.toISOString().split('T')[0];
                const settings = DatabaseService.getSettings();
                const [startH, startM] = settings.workStartTime.split(':').map(Number);

                let late = 0;
                allPersonnelForReport.forEach(p => {
                    const log = p.timeLogs?.find(l => l.date === todayStr);
                    if (log) {
                         const [h, m] = log.checkIn.split(':').map(Number);
                         if (h > startH || (h === startH && m > startM)) {
                             late++;
                         }
                    } else {
                        // Not checked in yet = potentially late/absent
                        late++;
                    }
                });
                
                if (late > 0) {
                    setLateCount(late);
                    setShowLateNotification(true);
                    // Hide after 10 seconds
                    setTimeout(() => setShowLateNotification(false), 10000);
                }
            }
        };

        // Run check once on load if time matches, or set a timeout/interval if needed
        // For simplicity, we check on mount/update of personnel list
        checkLate();

    }, [allPersonnelForReport, currentUser]);

    const handleSelectPersonnel = (personnel: Personnel) => {
        if (currentUser?.role === 'user' && personnel.id !== currentUser.personnelId) {
            return;
        }
        setSelectedPersonnel(personnel);
        setActiveTab('personnel');
    };

    const handleNewPersonnel = () => {
        setSelectedPersonnel(NEW_PERSONNEL_TEMPLATE);
        setActiveTab('personnel');
    };

    const handleDataUpdate = () => {
        loadPersonnel();
        if (selectedPersonnel && selectedPersonnel.id !== 'NEW') {
             const allData = DatabaseService.getPersonnel();
             const updatedSelected = allData.find(p => p.id === selectedPersonnel.id);
             setSelectedPersonnel(updatedSelected || null);
        }
    };

    const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (!window.confirm(`${file.name} dosyasından veri aktarılsın mı?`)) return;

            try {
                const result = await DatabaseService.importFromPdf(file, currentUser?.username);
                alert(result.message);
                if (result.success) {
                    loadPersonnel();
                }
            } catch (error) {
                alert('İşlem hatası.');
            }
            event.target.value = ''; 
        }
    };
    
    const filteredPersonnel = personnelList.filter(p =>
        p.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sicilNo.includes(searchTerm) ||
        p.id.includes(searchTerm)
    );

    const SidebarItem = ({ icon, label, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-sm font-medium border-l-4 
            ${active 
                ? 'bg-[#1e293b] border-teal-500 text-white shadow-lg' 
                : 'border-transparent text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
            }`}
        >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
        </button>
    );

    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
            
            {/* SIDEBAR */}
            <aside className="w-64 bg-[#0f172a] flex flex-col shadow-2xl z-20">
                <div className="h-16 flex items-center gap-3 px-6 bg-[#0f172a] border-b border-slate-800">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">C</div>
                    <h1 className="text-white font-bold tracking-wide">CNK<span className="text-teal-500">PORTAL</span></h1>
                </div>

                <div className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-6 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ana Menü</div>
                    <SidebarItem 
                        icon="📊" 
                        label="Dashboard" 
                        active={activeTab === 'dashboard'} 
                        onClick={() => { setActiveTab('dashboard'); setSelectedPersonnel(null); }} 
                    />
                    <SidebarItem 
                        icon="👥" 
                        label="Personel Listesi" 
                        active={activeTab === 'personnel'} 
                        onClick={() => setActiveTab('personnel')} 
                    />
                    
                    {currentUser?.role === 'admin' && (
                        <div className="px-4 my-2">
                            <button 
                                onClick={handleNewPersonnel}
                                className={`w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm flex items-center justify-center gap-2 ${btn3dClasses}`}
                            >
                                <span>+</span> PERSONEL EKLE
                            </button>
                        </div>
                    )}

                    {currentUser?.role === 'admin' && (
                        <>
                            <div className="px-6 mt-8 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Yönetim Araçları</div>
                            <SidebarItem icon="🗓️" label="İzin Yönetimi" onClick={() => setShowLeaveManagement(true)} />
                            <SidebarItem icon="🖨️" label="Belge Oluşturucu" onClick={() => setShowDocGenerator(true)} />
                            <SidebarItem icon="💰" label="Tazminat Hesapla" onClick={() => setShowCompensationCalc(true)} />
                            <SidebarItem icon="📡" label="Cihaz Bağlantısı" onClick={() => setShowDeviceIntegration(true)} />
                            <SidebarItem icon="🛡️" label="Denetim Kayıtları" onClick={() => setShowAuditLogs(true)} />
                            <SidebarItem icon="👥" label="Kullanıcılar" onClick={() => setShowUserManagement(true)} />
                            
                            <div className="px-4 mt-4">
                                <label className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 cursor-pointer transition-all rounded ${btn3dClasses}`}>
                                    <span>📄</span>
                                    <span>PDF İçe Aktar</span>
                                    <input type="file" onChange={handlePdfUpload} className="hidden" accept="application/pdf" />
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                            {currentUser?.username.substring(0,2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-white text-sm font-bold truncate">{currentUser?.username}</p>
                            <p className="text-slate-500 text-xs truncate">{currentUser?.role === 'admin' ? 'Yönetici' : 'Personel'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={logout} 
                        className={`w-full bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 ${btn3dClasses}`}
                    >
                        <span>🚪</span> Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Notification Toast */}
                {showLateNotification && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-bounce">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h4 className="font-bold">Geç Kalma Uyarısı!</h4>
                            <p className="text-sm">Bugün {lateCount} personel geç kaldı veya gelmedi.</p>
                        </div>
                        <button onClick={() => setShowLateNotification(false)} className="ml-auto text-white/80 hover:text-white">✕</button>
                    </div>
                )}

                {/* HEADER */}
                <header className="h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-8 z-10">
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'dashboard' ? 'Genel Bakış' : selectedPersonnel ? (selectedPersonnel.id === 'NEW' ? 'Yeni Personel Ekle' : selectedPersonnel.adSoyad) : 'Personel Yönetimi'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Hızlı Arama..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-teal-500 w-64 transition-all"
                            />
                            <span className="absolute left-3 top-2 text-slate-400">🔍</span>
                        </div>
                        <div className="w-px h-6 bg-slate-300 mx-2"></div>
                        <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors relative">
                            🔔 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* CONTENT SCROLL AREA */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Stats */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    <Dashboard personnelList={allPersonnelForReport} />
                                </div>
                                
                                {/* Recent Activity / Quick List */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h3 className="font-bold text-slate-700 mb-4">Personel Listesi</h3>
                                    <div className="h-[400px] overflow-y-auto custom-scrollbar">
                                        <PersonnelTable 
                                            personnelList={filteredPersonnel} 
                                            onSelectPersonnel={handleSelectPersonnel} 
                                            selectedPersonnelId={selectedPersonnel?.id || ''} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Quick Reports (Placeholder for future widgets) */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                                    <h3 className="font-bold text-lg mb-1">Hoş Geldiniz!</h3>
                                    <p className="text-teal-100 text-sm opacity-90">Sistem şu an aktif ve çalışıyor. Bugün {allPersonnelForReport.length} personel kaydı yönetiliyor.</p>
                                </div>

                                {selectedPersonnel && (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                                        <h3 className="font-bold text-slate-700 mb-2">Son Seçilen</h3>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                                                {selectedPersonnel.resim ? <img src={selectedPersonnel.resim} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">👤</div>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{selectedPersonnel.adSoyad}</p>
                                                <p className="text-xs text-slate-500">{selectedPersonnel.gorevi}</p>
                                            </div>
                                            <button onClick={() => setActiveTab('personnel')} className="ml-auto text-teal-600 text-xs font-bold hover:underline">GİT &rarr;</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'personnel' && (
                        <div className="flex flex-col xl:flex-row gap-6 h-full">
                            {/* List Column */}
                            <div className="xl:w-1/4 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[800px]">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700">Personel</h3>
                                    {currentUser?.role === 'admin' && 
                                        <button onClick={handleNewPersonnel} className="text-teal-600 hover:text-teal-800 font-bold text-xl" title="Yeni Personel">+</button>
                                    }
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <PersonnelTable 
                                        personnelList={filteredPersonnel} 
                                        onSelectPersonnel={handleSelectPersonnel} 
                                        selectedPersonnelId={selectedPersonnel?.id || ''} 
                                    />
                                </div>
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 flex flex-col gap-6">
                                {selectedPersonnel ? (
                                    <>
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                            <PersonnelDetails personnel={selectedPersonnel} onUpdate={handleDataUpdate} />
                                        </div>
                                        {selectedPersonnel.id !== 'NEW' && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                                        <LeaveTracker personnel={selectedPersonnel} onUpdate={handleDataUpdate} />
                                                    </div>
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                                        <TimeLogTracker personnel={selectedPersonnel} onUpdate={handleDataUpdate} />
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                                    <Reporting personnelList={currentUser?.role === 'admin' ? allPersonnelForReport : personnelList} />
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center flex-col text-slate-300">
                                        <span className="text-6xl mb-4">👤</span>
                                        <p className="text-lg">Detayları görüntülemek için listeden bir personel seçin.</p>
                                        {currentUser?.role === 'admin' && 
                                            <button onClick={handleNewPersonnel} className={`mt-4 bg-teal-600 text-white px-6 py-2 rounded ${btn3dClasses}`}>Yeni Personel Oluştur</button>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {showCompensationCalc && <CompensationCalculator onClose={() => setShowCompensationCalc(false)} allPersonnel={allPersonnelForReport} />}
            {showDeviceIntegration && <DeviceIntegration onClose={() => setShowDeviceIntegration(false)} onUpdate={handleDataUpdate} allPersonnel={allPersonnelForReport} />}
            {showDocGenerator && <DocumentGenerator onClose={() => setShowDocGenerator(false)} allPersonnel={allPersonnelForReport} />}
            {showAuditLogs && <AuditLogs onClose={() => setShowAuditLogs(false)} />}
            
            {showLeaveManagement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                        <LeaveManagement 
                            allPersonnel={allPersonnelForReport} 
                            onUpdate={handleDataUpdate} 
                            onClose={() => setShowLeaveManagement(false)}
                        />
                    </div>
                </div>
            )}

            {showUserManagement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto custom-scrollbar">
                        <UserManagementScreen onClose={() => setShowUserManagement(false)} onUpdate={handleDataUpdate} />
                    </div>
                </div>
            )}

            {/* AI FAB */}
            {currentUser?.role === 'admin' && <AIAssistant />}
        </div>
    );
};

export default MainScreen;
