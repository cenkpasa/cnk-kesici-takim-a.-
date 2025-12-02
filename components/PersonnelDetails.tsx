
import React, { useState, useEffect, useContext, useRef } from 'react';
import type { Personnel, PersonnelDocument } from '../types';
import { DatabaseService } from '../services/databaseService';
import { AppContext } from '../contexts/AppContext';

interface PersonnelDetailsProps {
    personnel: Personnel;
    onUpdate: () => void;
}

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyIgY2xhc3M9InctNiBoLTYiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTcuNSA2YTQuNSA0LjUgMCAxMSw5IDBWOWE2IDYgMCAxMC0xMiAwVjZhNC41IDQuNSAwIDAxLDQuNS00LjV6bS43NSAxMi4zNzVhLjc1Ljc1IDAgMDAtMS41IDB2Ljc1YzAsNC4xNCAzLjM2IDcuNSA3LjUgNy41czcuNS0zLjM2IDcuNS03LjV2LS43NWEuNzUuNzUgMCAwMC0xLjUgMHYuNzVjMCwzLjMxLTIuNjksNi02LDZzLTYtMi42OS02LTZ2LS43NXoiIGNsaXAtcnVsZT0iZXZlbm9kZCIgLz48L3N2Zz4=';

const PersonnelDetails: React.FC<PersonnelDetailsProps> = ({ personnel, onUpdate }) => {
    const [formData, setFormData] = useState<Personnel>(personnel);
    const [isNew, setIsNew] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
    const { currentUser } = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Security Check: Is the current user an Admin?
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        if (personnel.id === 'NEW') {
            setIsNew(true);
            // Auto-generate ID and Sicil for convenience, but allow editing
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const autoId = `TR${new Date().getFullYear()}${randomSuffix}`; 
            const autoSicil = `${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
            
            setFormData({
                ...personnel,
                id: autoId,
                sicilNo: autoSicil
            });
        } else {
            setFormData(personnel);
            setIsNew(false);
        }
        setActiveTab('info');
    }, [personnel]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Permission Logic:
        // Admins can edit everything.
        // Users can ONLY edit 'telefon' and 'adres'.
        if (!isAdmin) {
            if (name !== 'telefon' && name !== 'adres') {
                return; // Block changes to other fields
            }
        }
        
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value 
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) return;

        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData({ ...formData, resim: event.target?.result as string });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) {
            alert('Sadece yöneticiler belge ekleyebilir.');
            return;
        }

        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { 
                alert('Dosya boyutu çok büyük. Lütfen 5MB altında bir dosya seçin.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const newDoc: PersonnelDocument = {
                    id: `doc_${Date.now()}`,
                    name: file.name,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    data: event.target?.result as string,
                    uploadDate: new Date().toLocaleDateString('tr-TR')
                };
                
                const updatedDocs = [...(formData.documents || []), newDoc];
                setFormData({ ...formData, documents: updatedDocs });
                
                if (!isNew) {
                    DatabaseService.savePersonnel({ ...formData, documents: updatedDocs });
                    onUpdate();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteDocument = (docId: string) => {
        if (!isAdmin) {
            alert('Güvenlik: Belge silme yetkiniz yok.');
            return;
        }
        if(window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
             const updatedDocs = (formData.documents || []).filter(d => d.id !== docId);
             setFormData({ ...formData, documents: updatedDocs });
             if (!isNew) {
                DatabaseService.savePersonnel({ ...formData, documents: updatedDocs });
                onUpdate();
             }
        }
    };

    const viewDocument = (doc: PersonnelDocument) => {
        const win = window.open();
        if (win) {
            if (doc.type === 'pdf') {
                win.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            } else {
                win.document.write(`<img src="${doc.data}" style="max-width: 100%;" />`);
            }
        }
    };

    const triggerFileInput = () => {
        if (isAdmin) fileInputRef.current?.click();
    };

    const triggerDocInput = () => {
        if (isAdmin) docInputRef.current?.click();
    }
    
    const handleSave = () => {
        if (!isAdmin) {
            // Users can technically save if they edited their phone/address, 
            // but we need to make sure they don't overwrite protected fields.
            // Since the state is local, calling savePersonnel with formData is safe 
            // IF the backend/service also checked. Here we trust the UI restriction + Service Logic.
        }
        
        if (!formData.adSoyad || !formData.id) {
            alert('Lütfen Ad Soyad ve T.C. Kimlik No alanlarını doldurun.');
            return;
        }

        DatabaseService.savePersonnel(formData, currentUser?.username);
        onUpdate();
        alert('Personel bilgileri kaydedildi.');
        if(isNew) setIsNew(false);
    }
    
    const handleDelete = () => {
        if (!isAdmin) {
            alert('Yetkisiz işlem.');
            return;
        }
        if (window.confirm(`${formData.adSoyad} personelini silmek istediğinizden emin misiniz?`)) {
            DatabaseService.deletePersonnel(formData.id, currentUser?.username);
            onUpdate();
            alert('Personel silindi.');
        }
    }
    
    const handleResetNew = () => {
         if (!isAdmin) {
            alert('Yetkisiz işlem.');
            return;
        }
        // Generate new IDs again
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const newId = `TR${new Date().getFullYear()}${randomSuffix}`;
        const newSicil = `${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;

        setFormData({
            id: newId,
            sicilNo: newSicil,
            adSoyad: '',
            gorevi: '',
            leaves: [],
            timeLogs: [],
            bonuses: [],
            deductions: [],
            baseSalary: 0,
            hourlyRate: 0,
            documents: []
        });
        setIsNew(true);
        setActiveTab('info');
    }

    // Helper to determine readOnly state
    const isReadOnly = (fieldName: string) => {
        if (isAdmin) return false; // Admin can edit all
        // Users can only edit phone and address
        if (fieldName === 'telefon' || fieldName === 'adres') return false;
        return true; // Everything else is read-only for users
    };

    const inputStyle = (fieldName: string) => `w-full border border-gray-300 rounded px-3 py-2 text-sm transition-colors ${isReadOnly(fieldName) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-teal-500 outline-none'}`;
    
    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="p-4 bg-white h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                 <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    {isNew ? <span className="text-teal-600">✨ YENİ PERSONEL KARTI</span> : 'PERSONEL DOSYASI'}
                 </h2>
                 <div className="flex space-x-2">
                     <button 
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === 'info' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        KİMLİK & GÖREV
                     </button>
                     <button 
                        onClick={() => setActiveTab('documents')}
                        className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === 'documents' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                     >
                        ÖZLÜK DOSYASI
                     </button>
                 </div>
            </div>
            
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 content-start">
                        {/* ID - Special handling for new/edit */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">T.C. Kimlik No / ID</label>
                            <input 
                                type="text" 
                                value={formData.id} 
                                name="id" 
                                onChange={handleChange} 
                                className={inputStyle('id')} 
                                readOnly={!isNew && !isAdmin} // Editable only if New or Admin
                            />
                            {isNew && <p className="text-[10px] text-teal-600 mt-1">* Otomatik önerilen ID. Değiştirebilirsiniz.</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Sicil No</label>
                            <input type="text" value={formData.sicilNo} name="sicilNo" onChange={handleChange} className={inputStyle('sicilNo')} readOnly={isReadOnly('sicilNo')} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Ad Soyad</label>
                            <input type="text" value={formData.adSoyad} name="adSoyad" onChange={handleChange} className={inputStyle('adSoyad')} readOnly={isReadOnly('adSoyad')} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Görevi</label>
                            <input type="text" value={formData.gorevi} name="gorevi" onChange={handleChange} className={inputStyle('gorevi')} readOnly={isReadOnly('gorevi')} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">SGK Numarası</label>
                            <input type="text" value={formData.sgkNo || ''} name="sgkNo" onChange={handleChange} className={inputStyle('sgkNo')} readOnly={isReadOnly('sgkNo')} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Telefon {isReadOnly('telefon') ? '' : '✏️'}</label>
                            <input type="text" value={formData.telefon || ''} name="telefon" onChange={handleChange} className={inputStyle('telefon')} readOnly={isReadOnly('telefon')} placeholder="05XX..." />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Ev Adresi {isReadOnly('adres') ? '' : '✏️'}</label>
                            <input type="text" value={formData.adres || ''} name="adres" onChange={handleChange} className={inputStyle('adres')} readOnly={isReadOnly('adres')} placeholder="Açık adres giriniz..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">İşe Giriş Tarihi</label>
                            <input type="date" value={formData.iseGirisTarihi || ''} name="iseGirisTarihi" onChange={handleChange} className={inputStyle('iseGirisTarihi')} readOnly={isReadOnly('iseGirisTarihi')} />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">İşten Ayrılış Tarihi</label>
                            <input type="date" value={formData.istenAyrilisTarihi || ''} name="istenAyrilisTarihi" onChange={handleChange} className={inputStyle('istenAyrilisTarihi')} readOnly={isReadOnly('istenAyrilisTarihi')} />
                        </div>
                        
                        {isAdmin && (
                            <>
                                <hr className="col-span-2 my-2 border-slate-200" />
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Aylık Brüt Maaş (TL)</label>
                                    <input type="number" value={formData.baseSalary || 0} name="baseSalary" onChange={handleChange} className={inputStyle('baseSalary')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Saatlik Ücret (TL)</label>
                                    <input type="number" value={formData.hourlyRate || 0} name="hourlyRate" onChange={handleChange} className={inputStyle('hourlyRate')} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-48 border-4 border-white shadow-xl rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img src={formData.resim || defaultAvatar} alt="personel" className="w-full h-full object-cover" />
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                            ref={fileInputRef}
                        />
                        {isAdmin && (
                            <button 
                                onClick={triggerFileInput}
                                className={`px-4 py-2 bg-slate-600 text-white rounded shadow hover:bg-slate-700 text-xs font-bold w-40 ${btn3dClasses}`}
                            >
                                FOTOĞRAF YÜKLE
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="flex flex-col h-full">
                     <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-center gap-2">
                        <span>📁</span>
                        <p><strong>Dijital Özlük Dosyası:</strong> İmzalı zimmet tutanakları, sözleşmeler ve diğer resmi evraklar. {isAdmin ? '' : '(Sadece Görüntüleme)'}</p>
                     </div>
                     
                     <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg overflow-y-auto p-4 mb-4 custom-scrollbar">
                        {(!formData.documents || formData.documents.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="text-4xl mb-2">📂</span>
                                <p className="italic">Henüz yüklenmiş belge yok.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {formData.documents.map((doc) => (
                                    <li key={doc.id} className="flex justify-between items-center p-3 bg-white rounded shadow-sm border border-slate-100 hover:border-teal-300 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-2xl">{doc.type === 'pdf' ? '📄' : '🖼️'}</span>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm truncate w-64 text-slate-800" title={doc.name}>{doc.name}</span>
                                                <span className="text-xs text-slate-500">{doc.uploadDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => viewDocument(doc)} className={`px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 ${btn3dClasses}`}>AÇ</button>
                                            {isAdmin && (
                                                <button onClick={() => deleteDocument(doc.id)} className={`px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 ${btn3dClasses}`}>SİL</button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                     </div>

                     {isAdmin && (
                        <>
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={handleDocumentUpload} 
                                className="hidden" 
                                ref={docInputRef}
                            />
                            <button 
                                onClick={triggerDocInput}
                                className={`w-full py-3 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 flex justify-center items-center gap-2 text-sm ${btn3dClasses}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                YENİ BELGE EKLE (TARAMA/PDF)
                            </button>
                        </>
                     )}
                </div>
            )}

             <div className="mt-auto flex space-x-4 border-t border-slate-200 pt-4 justify-center">
                {isAdmin && (
                    <button onClick={handleResetNew} className={`px-6 py-2 bg-slate-200 text-slate-700 border border-slate-300 rounded shadow hover:bg-slate-300 font-bold ${btn3dClasses}`}>
                        TEMİZLE / YENİ
                    </button>
                )}
                {/* Save button visible to all, but logic protects fields inside handleChange */}
                <button onClick={handleSave} className={`px-6 py-2 bg-teal-600 text-white border border-teal-700 rounded shadow hover:bg-teal-700 font-bold ${btn3dClasses}`}>
                    {isAdmin ? 'KAYDET' : 'GÜNCELLE'}
                </button>
                {isAdmin && !isNew && (
                    <button onClick={handleDelete} className={`px-6 py-2 bg-red-100 text-red-700 border border-red-300 rounded shadow hover:bg-red-200 font-bold ${btn3dClasses}`}>
                        SİL
                    </button>
                )}
            </div>
        </div>
    );
};

export default PersonnelDetails;
