
import React, { useState, useEffect } from 'react';
import { Personnel } from '../types';

interface CompensationCalculatorProps {
    onClose: () => void;
    allPersonnel: Personnel[];
}

const CompensationCalculator: React.FC<CompensationCalculatorProps> = ({ onClose, allPersonnel }) => {
    const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
    const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
    const [grossSalary, setGrossSalary] = useState(0);
    const [additionalBenefits, setAdditionalBenefits] = useState(0);
    // 2025 First Half Ceiling (approximate, user should verify)
    const [severanceCeiling, setSeveranceCeiling] = useState(54343.76); 
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (allPersonnel.length > 0) {
            const p = allPersonnel[0];
            setSelectedPersonnelId(p.id);
            setGrossSalary(p.baseSalary || 0);
        }
    }, [allPersonnel]);

    const handlePersonnelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedPersonnelId(id);
        const p = allPersonnel.find(per => per.id === id);
        if (p) setGrossSalary(p.baseSalary || 0);
    };

    const calculate = () => {
        const personnel = allPersonnel.find(p => p.id === selectedPersonnelId);
        if (!personnel || !personnel.iseGirisTarihi) {
            alert('Personel veya işe giriş tarihi bulunamadı.');
            return;
        }

        const startDate = new Date(personnel.iseGirisTarihi);
        const endDate = new Date(terminationDate);

        if (endDate < startDate) {
            alert('Çıkış tarihi giriş tarihinden önce olamaz.');
            return;
        }

        // Accurate Date Calculation
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Precise Tenure logic
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();

        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // 1. Severance (Kıdem)
        const giydirilmisUcret = grossSalary + additionalBenefits;
        const kidemEsasUcret = Math.min(giydirilmisUcret, severanceCeiling);
        
        const grossSeverance = (kidemEsasUcret * years) + 
                               (kidemEsasUcret / 12 * months) + 
                               (kidemEsasUcret / 365 * days);
        
        const stampTaxRate = 0.00759;
        const stampTaxSeverance = grossSeverance * stampTaxRate;
        const netSeverance = grossSeverance - stampTaxSeverance;

        // 2. Notice (İhbar)
        // <6mo: 2w, <1.5y: 4w, <3y: 6w, >3y: 8w
        let noticeWeeks = 0;
        if (totalDays < 180) noticeWeeks = 2;
        else if (totalDays < 540) noticeWeeks = 4;
        else if (totalDays < 1080) noticeWeeks = 6;
        else noticeWeeks = 8;

        const grossNoticePay = (giydirilmisUcret / 30) * (noticeWeeks * 7);
        
        // Tax rates 2025
        const incomeTaxRate = 0.15; // Base bracket
        const incomeTaxNotice = grossNoticePay * incomeTaxRate;
        const stampTaxNotice = grossNoticePay * stampTaxRate;
        const netNoticePay = grossNoticePay - incomeTaxNotice - stampTaxNotice;

        setResult({
            startDate: personnel.iseGirisTarihi,
            endDate: terminationDate,
            tenureStr: `${years} Yıl, ${months} Ay, ${days} Gün`,
            kidemEsasUcret,
            grossSeverance,
            stampTaxSeverance,
            netSeverance,
            noticeWeeks,
            grossNoticePay,
            incomeTaxNotice,
            stampTaxNotice,
            netNoticePay,
            totalNet: netSeverance + netNoticePay
        });
    };

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Tazminat Hesaplayıcı (2025)</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Personel</label>
                            <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedPersonnelId} onChange={handlePersonnelChange}>
                                {allPersonnel.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Çıkış Tarihi</label>
                            <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Aylık Brüt (TL)</label>
                            <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" value={grossSalary} onChange={e => setGrossSalary(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Yan Haklar (Yemek/Yol)</label>
                            <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" value={additionalBenefits} onChange={e => setAdditionalBenefits(parseFloat(e.target.value))} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Kıdem Tavanı (2025/1)</label>
                            <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-slate-50" value={severanceCeiling} onChange={e => setSeveranceCeiling(parseFloat(e.target.value))} />
                        </div>
                    </div>

                    <button onClick={calculate} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors">HESAPLA</button>

                    {result && (
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-bold text-indigo-600 border-b pb-1 mb-2">KIDEM TAZMİNATI</h4>
                                    <div className="flex justify-between mb-1"><span>Hizmet:</span> <span className="font-medium">{result.tenureStr}</span></div>
                                    <div className="flex justify-between mb-1"><span>Brüt:</span> <span>{formatMoney(result.grossSeverance)}</span></div>
                                    <div className="flex justify-between mb-1 text-red-500"><span>Damga V.:</span> <span>-{formatMoney(result.stampTaxSeverance)}</span></div>
                                    <div className="flex justify-between mt-2 pt-2 border-t font-bold text-lg"><span>NET:</span> <span className="text-green-600">{formatMoney(result.netSeverance)}</span></div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-bold text-indigo-600 border-b pb-1 mb-2">İHBAR TAZMİNATI</h4>
                                    <div className="flex justify-between mb-1"><span>Süre:</span> <span className="font-medium">{result.noticeWeeks} Hafta</span></div>
                                    <div className="flex justify-between mb-1"><span>Brüt:</span> <span>{formatMoney(result.grossNoticePay)}</span></div>
                                    <div className="flex justify-between mb-1 text-red-500"><span>Vergiler:</span> <span>-{formatMoney(result.incomeTaxNotice + result.stampTaxNotice)}</span></div>
                                    <div className="flex justify-between mt-2 pt-2 border-t font-bold text-lg"><span>NET:</span> <span className="text-green-600">{formatMoney(result.netNoticePay)}</span></div>
                                </div>
                            </div>
                            <div className="bg-indigo-600 text-white p-4 rounded-lg text-center">
                                <span className="block text-sm opacity-80">TOPLAM ÖDENECEK NET TUTAR</span>
                                <span className="block text-3xl font-bold">{formatMoney(result.totalNet)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompensationCalculator;
