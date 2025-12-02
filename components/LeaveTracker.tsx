
import React, { useMemo, useState } from 'react';
import type { LeaveRecord, Personnel } from '../types';
import { DatabaseService } from '../services/databaseService';

interface LeaveTrackerProps {
    personnel: Personnel;
    onUpdate: () => void;
}

const statusStyles = {
    pending: 'bg-yellow-200 text-yellow-800',
    approved: 'bg-green-200 text-green-800',
    rejected: 'bg-red-200 text-red-800',
};
const statusText = {
    pending: 'Beklemede',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
};

const LeaveTracker: React.FC<LeaveTrackerProps> = ({ personnel, onUpdate }) => {
    const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', izinCesidi: 'Yıllık İzin', aciklama: '' });

    const leaveSummary = useMemo(() => {
        const approvedLeaves = personnel.leaves.filter(l => l.status === 'approved');
        const totalLeave = approvedLeaves.reduce((sum, leave) => sum + leave.kacGun, 0);
        
        let entitlement = 0;
        let yearsWorked = 0;
        let explanation = "Giriş tarihi yok";
        
        if (personnel.iseGirisTarihi) {
            const start = new Date(personnel.iseGirisTarihi);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - start.getTime());
            yearsWorked = diffTime / (1000 * 60 * 60 * 24 * 365.25);

            if (yearsWorked < 1) {
                entitlement = 0; 
                explanation = "1 yıldan az kıdem";
            } else if (yearsWorked >= 1 && yearsWorked <= 5) {
                entitlement = 14;
                explanation = "1-5 yıl kıdem (14 gün)";
            } else if (yearsWorked > 5 && yearsWorked < 15) {
                entitlement = 20;
                explanation = "5-15 yıl kıdem (20 gün)";
            } else if (yearsWorked >= 15) {
                entitlement = 26;
                explanation = "15+ yıl kıdem (26 gün)";
            }

            if (personnel.dogumTarihi && entitlement > 0) {
                const birth = new Date(personnel.dogumTarihi);
                const ageDiff = Math.abs(now.getTime() - birth.getTime());
                const age = ageDiff / (1000 * 60 * 60 * 24 * 365.25);

                if ((age <= 18 || age >= 50) && entitlement < 20) {
                    entitlement = 20;
                    explanation += " + Yaş avantajı (50+ veya 18- için min. 20 gün)";
                }
            }
        }

        const kesilenGun = approvedLeaves.filter(l => l.izinCesidi === 'Rapor').length > 0 ? 2 : 0;
        const usedAnnualLeave = approvedLeaves
            .filter(l => l.izinCesidi === 'Yıllık İzin')
            .reduce((sum, l) => sum + l.kacGun, 0);

        const kalanIzinHakki = Math.max(0, entitlement - usedAnnualLeave);
        
        return { totalLeave, kesilenGun, usedAnnualLeave, kalanIzinHakki, entitlement, yearsWorked, explanation };
    }, [personnel]);

    const sendLeaveRequestEmail = (leaveData: { startDate: string, endDate: string, izinCesidi: string, aciklama: string }) => {
        const recipient = "cenk@cnkkesicitakim.com.tr";
        const subject = `İzin Talebi - ${personnel.adSoyad}`;
        const body = `Sayın Cenk Dikmen,
        
${personnel.adSoyad} isimli personel aşağıdaki detaylarla izin talebinde bulunmuştur:

İzin Türü: ${leaveData.izinCesidi}
Başlangıç Tarihi: ${leaveData.startDate}
Bitiş Tarihi: ${leaveData.endDate}
Açıklama: ${leaveData.aciklama}

Lütfen Personel Takip Uygulaması üzerinden onay veya ret işlemini gerçekleştiriniz.

Saygılarımla.`;

        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    const handleAddLeave = () => {
        if (!newLeave.startDate || !newLeave.endDate) {
            alert('Lütfen geçerli bir başlangıç ve bitiş tarihi girin.');
            return;
        }
        if (new Date(newLeave.startDate) > new Date(newLeave.endDate)) {
            alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
            return;
        }
        
        // Save to DB
        DatabaseService.addLeave({
            personnelId: personnel.id,
            ...newLeave
        });
        onUpdate();
        
        // Trigger Email
        sendLeaveRequestEmail(newLeave);

        setNewLeave({ startDate: '', endDate: '', izinCesidi: 'Yıllık İzin', aciklama: '' });
        alert('İzin talebi kaydedildi ve e-posta istemcisi açıldı.');
    };

    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="p-2 border bg-gray-200 shadow-inner flex flex-col gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2 border bg-gray-100 shadow-inner">
                    <h2 className="font-bold border-b pb-1 mb-2">BİLGİLER (İş Kanunu Esaslı)</h2>
                    <div className="space-y-1 text-xs">
                        <div className="flex"><span className="w-32 font-semibold shrink-0">ADI-SOYADI</span>: <span className="ml-2 text-blue-700 font-bold">{personnel.adSoyad}</span></div>
                        <div className="flex"><span className="w-32 font-semibold shrink-0">KIDEM SÜRESİ</span>: <span className="ml-2">{leaveSummary.yearsWorked.toFixed(1)} Yıl</span></div>
                        <div className="flex items-start">
                            <span className="w-32 font-semibold shrink-0">YILLIK İZİN HAKKI</span>: 
                            <div className="ml-2 flex flex-col">
                                <span className="text-blue-900 font-bold">{leaveSummary.entitlement} Gün</span>
                                <span className="text-[10px] text-gray-500 italic">({leaveSummary.explanation})</span>
                            </div>
                        </div>
                        <div className="flex"><span className="w-32 font-semibold shrink-0">KULLANILAN İZİN</span>: <span className="ml-2 text-orange-600 font-bold">{leaveSummary.usedAnnualLeave} Gün</span></div>
                        <div className="flex"><span className="w-32 font-semibold shrink-0">GENEL TOPLAM</span>: <span className="ml-2 text-gray-600 font-bold">{leaveSummary.totalLeave} Gün</span></div>
                        <div className="flex"><span className="w-32 font-semibold shrink-0">KALAN İZİN HAKKI</span>: <span className="ml-2 text-green-700 font-bold text-sm">{leaveSummary.kalanIzinHakki} Gün</span></div>
                    </div>
                </div>
                <div className="p-2 border bg-gray-100 shadow-inner">
                    <h2 className="font-bold border-b pb-1 mb-2">YENİ İZİN TALEBİ</h2>
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-3 items-center"><label>BAŞLANGIÇ :</label><input type="date" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} className="col-span-2 border border-gray-400 px-1 bg-white" /></div>
                        <div className="grid grid-cols-3 items-center"><label>BİTİŞ :</label><input type="date" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} className="col-span-2 border border-gray-400 px-1 bg-white" /></div>
                        <div className="grid grid-cols-3 items-center"><label>İZİN ÇEŞİDİ :</label><select value={newLeave.izinCesidi} onChange={e => setNewLeave({...newLeave, izinCesidi: e.target.value})} className="col-span-2 border border-gray-400 px-1 bg-white"><option>Yıllık İzin</option><option>Rapor</option><option>Mazeret İzni</option><option>Ücretsiz İzin</option><option>Babalık İzni</option><option>Evlilik İzni</option><option>Ölüm İzni</option></select></div>
                        <div className="grid grid-cols-3 items-center"><label>AÇIKLAMA :</label><input type="text" value={newLeave.aciklama} onChange={e => setNewLeave({...newLeave, aciklama: e.target.value})} className="col-span-2 border border-gray-400 px-1 bg-white" /></div>
                        <div className="text-right">
                            <button onClick={handleAddLeave} className={`px-4 py-1 bg-blue-500 text-white font-bold rounded shadow-md border border-blue-700 hover:bg-blue-600 flex items-center justify-center w-full ${btn3dClasses}`}>
                                <span className="mr-2">✉️</span> TALEP GÖNDER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                 <h2 className="font-bold border-b pb-1 mb-2">İZİN TALEPLERİM</h2>
                 <div className="h-40 overflow-y-auto bg-white border p-1">
                    {personnel.leaves.length > 0 ? (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-1 border-b">Başlangıç</th>
                                    <th className="p-1 border-b">Bitiş</th>
                                    <th className="p-1 border-b">Gün</th>
                                    <th className="p-1 border-b">Tür</th>
                                    <th className="p-1 border-b">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...personnel.leaves].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((leave: LeaveRecord) => (
                                    <tr key={leave.id}>
                                        <td className="p-1 border-b">{new Date(leave.startDate).toLocaleDateString('tr-TR')}</td>
                                        <td className="p-1 border-b">{new Date(leave.endDate).toLocaleDateString('tr-TR')}</td>
                                        <td className="p-1 border-b">{leave.kacGun}</td>
                                        <td className="p-1 border-b">{leave.izinCesidi}</td>
                                        <td className="p-1 border-b">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[leave.status]}`}>
                                                {statusText[leave.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 mt-4">İzin talebi bulunamadı.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default LeaveTracker;
