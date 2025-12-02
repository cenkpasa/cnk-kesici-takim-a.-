
import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/databaseService';
import type { User, Personnel } from '../types';

interface UserManagementScreenProps {
    onClose: () => void;
    onUpdate: () => void;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onClose, onUpdate }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user' as 'admin' | 'user',
        personnelId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setUsers(DatabaseService.getUsers());
        setPersonnelList(DatabaseService.getPersonnel());
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '', // Don't show existing password
            role: user.role,
            personnelId: user.personnelId || ''
        });
        setIsNew(false);
    };

    const handleNewUser = () => {
        setSelectedUser(null);
        setFormData({
            username: '',
            password: '',
            role: 'user',
            personnelId: ''
        });
        setIsNew(true);
    };

    const handleSave = () => {
        if (!formData.username || (!formData.password && isNew)) {
            alert('Kullanıcı adı ve şifre alanları zorunludur.');
            return;
        }

        // Validate Unique Username
        const duplicateUser = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());
        if (isNew && duplicateUser) {
            alert('Bu kullanıcı adı zaten kullanılıyor. Lütfen farklı bir ad seçin.');
            return;
        }
        if (!isNew && duplicateUser && duplicateUser.id !== selectedUser?.id) {
            alert('Bu kullanıcı adı zaten başka bir kullanıcı tarafından kullanılıyor.');
            return;
        }

        if (isNew) {
            DatabaseService.createUser({
                username: formData.username,
                password: formData.password,
                role: formData.role,
                personnelId: formData.personnelId || undefined
            });
            alert('Yeni kullanıcı başarıyla oluşturuldu.');
        } else if (selectedUser) {
            const updatedUserData: Partial<User> = {
                username: formData.username,
                role: formData.role,
                personnelId: formData.personnelId || undefined
            };
            if(formData.password) {
                updatedUserData.password = formData.password;
            }
            DatabaseService.updateUser({ ...selectedUser, ...updatedUserData });
            alert('Kullanıcı bilgileri güncellendi.');
        }
        
        loadData();
        onUpdate();
        handleNewUser();
    };

    const handleDelete = () => {
        if (selectedUser) {
            if (selectedUser.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
                alert('Sistemde en az bir yönetici kalmalıdır. Bu hesabı silemezsiniz.');
                return;
            }
            if(window.confirm(`${selectedUser.username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
                DatabaseService.deleteUser(selectedUser.id);
                alert('Kullanıcı silindi.');
                loadData();
                onUpdate();
                handleNewUser();
            }
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputStyle = "w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all";

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>👥</span> Kullanıcı Yönetimi
                </h2>
                <button onClick={onClose} className="bg-slate-700 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold">&times;</button>
            </div>
            
            <div className="flex flex-1 overflow-hidden p-6 gap-6 bg-slate-50">
                {/* Left Column: User List */}
                <div className="w-1/3 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Kullanıcı ara..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {filteredUsers.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => handleSelectUser(user)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border flex justify-between items-center ${selectedUser?.id === user.id 
                                    ? 'bg-teal-50 border-teal-200 shadow-sm' 
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${selectedUser?.id === user.id ? 'text-teal-800' : 'text-slate-700'}`}>{user.username}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                                    </div>
                                </div>
                                {selectedUser?.id === user.id && <span className="text-teal-600 text-lg">›</span>}
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">Kullanıcı bulunamadı.</p>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                        <button 
                            onClick={handleNewUser} 
                            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <span>+</span> Yeni Kullanıcı Ekle
                        </button>
                    </div>
                </div>

                {/* Right Column: User Form */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-6 overflow-y-auto">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                        {isNew ? <span className="text-teal-600">✨ Yeni Kullanıcı Oluştur</span> : <span className="text-indigo-600">✏️ Kullanıcıyı Düzenle</span>}
                    </h3>
                    
                    <div className="space-y-6 max-w-lg">
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Kullanıcı Adı</label>
                            <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={inputStyle} placeholder="Örn: ahmet.yilmaz" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Şifre {isNew ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-slate-400">(Değiştirmek için doldurun)</span>}
                            </label>
                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputStyle} placeholder="••••••••" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Rol / Yetki</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'user'})} className={inputStyle}>
                                    <option value="user">Çalışan (Standart)</option>
                                    <option value="admin">Yönetici (Tam Yetki)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Bağlı Personel Kartı</label>
                                <select 
                                    value={formData.personnelId} 
                                    onChange={e => setFormData({...formData, personnelId: e.target.value})} 
                                    className={`${inputStyle} ${formData.role === 'admin' ? 'bg-gray-100 text-gray-400' : ''}`}
                                    disabled={formData.role === 'admin'} // Typically admins don't track time, but can be changed
                                >
                                    <option value="">-- İlişki Yok --</option>
                                    {personnelList.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">Sadece "Çalışan" rolü için gereklidir.</p>
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-6 border-t mt-6">
                             <button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-all">
                                {isNew ? 'Kullanıcıyı Oluştur' : 'Değişiklikleri Kaydet'}
                             </button>
                             
                             {!isNew && selectedUser && (
                                <button onClick={handleDelete} className="px-6 py-2.5 bg-red-100 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-200 transition-all">
                                    Sil
                                </button>
                             )}
                             
                             <button onClick={handleNewUser} className="px-6 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-300 transition-all">
                                İptal
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementScreen;
