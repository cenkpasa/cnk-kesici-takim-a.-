
import React, { useMemo, useState } from 'react';
import type { Personnel, LeaveRecord } from '../types';
import { DatabaseService } from '../services/databaseService';

interface LeaveManagementProps {
    allPersonnel: Personnel[];
    onUpdate: () => void;
    onClose?: () => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ allPersonnel, onUpdate, onClose }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'summary'>('pending');

    const pendingRequests = useMemo(() => {
        const requests: (LeaveRecord & { adSoyad: string })[] = [];
        allPersonnel.forEach(p => {
            p.leaves.forEach(l => {
                if (l.status === 'pending') {
                    requests.push({ ...l, adSoyad: p.adSoyad });
                }
            });
        });
        return requests.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [allPersonnel]);

    const personnelSummary = useMemo(() => {
        return allPersonnel.map(p => {
            const totalUsed = p.leaves
                .filter(l => l.status === 'approved')
                .reduce((sum, l) => sum + l.kacGun, 0);
            
            // Basic calculation for entitlement logic (simplified version of LeaveTracker logic)
            let entitlement = 0;
            if (p.iseGirisTarihi) {
                const start = new Date(p.iseGirisTarihi);
                const now = new Date();
                const years = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                if (years >= 1 && years <= 5) entitlement = 14;
                else if (years > 5 && years < 15) entitlement = 20;
                else if (years >= 15) entitlement = 26;
                
                // Age check
                if (p.dogumTarihi) {
                    const age = (now.getTime() - new Date(p.dogumTarihi).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                    if ((age < 18 || age > 50) && entitlement < 20 && years >= 1) entitlement = 20;
                }
            }

            return {
                id: p.id,
                adSoyad: p.adSoyad,
                totalUsed,
                entitlement,
                remaining: Math.max(0, entitlement - totalUsed),
                pendingCount: p.leaves.filter(l => l.status === 'pending').length
            };
        });
    }, [allPersonnel]);

    const handleApprove = (leave: LeaveRecord & { adSoyad: string }) => {
        if(window.confirm(`${leave.adSoyad} isimli personelin izin talebini onaylamak istediğinizden emin misiniz?`)){
            DatabaseService.updateLeaveStatus(leave.id, leave.personnelId, 'approved');
            onUpdate();
        }
    };

    const handleReject = (leave: LeaveRecord & { adSoyad: string }) => {
         if(window.confirm(`${leave.adSoyad} isimli personelin izin talebini reddetmek istediğinizden emin misiniz?`)){
            DatabaseService.updateLeaveStatus(leave.id, leave.personnelId, 'rejected');
            onUpdate();
        }
    };

    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="bg-white h-full flex flex-col">
            {onClose && (
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">İzin Yönetim Merkezi</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
                </div>
            )}
            
            <div className="flex border-b">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-3 text-sm font-bold ${activeTab === 'pending' ? 'border-b-2 border-teal-600 text-teal-800 bg-teal-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Bekleyen Talepler ({pendingRequests.length})
                </button>
                <button 
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-3 text-sm font-bold ${activeTab === 'summary' ? 'border-b-2 border-blue-600 text-blue-800 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Personel İzin Özetleri
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100">
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                         {pendingRequests.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-3 font-bold text-gray-700">Personel</th>
                                            <th className="p-3 font-bold text-gray-700">Tarihler</th>
                                            <th className="p-3 font-bold text-gray-700">Gün</th>
                                            <th className="p-3 font-bold text-gray-700">Tür</th>
                                            <th className="p-3 font-bold text-gray-700">Açıklama</th>
                                            <th className="p-3 font-bold text-gray-700 text-center">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-yellow-50 transition-colors">
                                                <td className="p-3 font-semibold text-blue-800">{req.adSoyad}</td>
                                                <td className="p-3 text-gray-600">
                                                    {new Date(req.startDate).toLocaleDateString('tr-TR')} - {new Date(req.endDate).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td className="p-3 font-bold">{req.kacGun}</td>
                                                <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{req.izinCesidi}</span></td>
                                                <td className="p-3 text-gray-500 italic max-w-xs truncate">{req.aciklama}</td>
                                                <td className="p-3 text-center flex justify-center gap-2">
                                                    <button onClick={() => handleApprove(req)} className={`px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 shadow-sm font-bold ${btn3dClasses}`}>Onayla</button>
                                                    <button onClick={() => handleReject(req)} className={`px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 shadow-sm font-bold ${btn3dClasses}`}>Reddet</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                                <span className="text-4xl mb-2">✓</span> 
                                <p>Bekleyen izin talebi yok.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'summary' && (
                     <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b text-gray-600">
                                <tr>
                                    <th className="p-3 font-bold">Personel</th>
                                    <th className="p-3 font-bold text-center">Hak Edilen</th>
                                    <th className="p-3 font-bold text-center">Kullanılan</th>
                                    <th className="p-3 font-bold text-center">Kalan</th>
                                    <th className="p-3 font-bold text-center">Bekleyen Talep</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {personnelSummary.map(p => (
                                    <tr key={p.id} className="hover:bg-blue-50">
                                        <td className="p-3 font-medium text-slate-700">{p.adSoyad}</td>
                                        <td className="p-3 text-center font-bold text-slate-600">{p.entitlement}</td>
                                        <td className="p-3 text-center text-orange-600 font-bold">{p.totalUsed}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.remaining > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {p.remaining}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {p.pendingCount > 0 ? (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">{p.pendingCount}</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                )}
            </div>
        </div>
    );
};

export default LeaveManagement;
