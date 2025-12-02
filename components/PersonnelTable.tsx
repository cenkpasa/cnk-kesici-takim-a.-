
import React from 'react';
import type { Personnel } from '../types';

interface PersonnelTableProps {
    personnelList: Personnel[];
    onSelectPersonnel: (personnel: Personnel) => void;
    selectedPersonnelId: string;
}

const PersonnelTable: React.FC<PersonnelTableProps> = ({ personnelList, onSelectPersonnel, selectedPersonnelId }) => {
    
    const calculateTotalLeave = (personnel: Personnel) => {
        return personnel.leaves
            .filter(l => l.status === 'approved')
            .reduce((acc, leave) => acc + leave.kacGun, 0);
    }
    
    // For demo, "Kesilen Gün" and "Kesilecek Gün" are mocked. 
    // A real app would have complex logic for this.
    const getKesilenGun = (p: Personnel) => p.leaves.filter(l => l.status === 'approved' && l.izinCesidi === "Rapor").length > 0 ? 2 : 0;
    const getKesilecekGun = (p: Personnel) => calculateTotalLeave(p) - getKesilenGun(p);


    return (
        <div className="overflow-x-auto bg-white">
            <table className="w-full border-collapse border border-gray-400 text-left">
                <thead className="bg-gray-300">
                    <tr className="bg-gradient-to-b from-[#0A246A] to-[#A6CAF0] text-white">
                        <th className="border border-gray-400 px-2 py-1">SIRA</th>
                        <th className="border border-gray-400 px-2 py-1">T.C. KİMLİK NO</th>
                        <th className="border border-gray-400 px-2 py-1">SİCİL NO</th>
                        <th className="border border-gray-400 px-2 py-1">AD-SOYAD</th>
                        <th className="border border-gray-400 px-2 py-1">GÖREVİ</th>
                        <th className="border border-gray-400 px-2 py-1 text-center">RAPOR TOP.</th>
                        <th className="border border-gray-400 px-2 py-1 text-center">KESİLEN TOP.</th>
                        <th className="border border-gray-400 px-2 py-1 text-center">KESİLECEK GÜN</th>
                    </tr>
                </thead>
                <tbody>
                    {personnelList.map((personnel, index) => (
                        <tr
                            key={personnel.id}
                            onClick={() => onSelectPersonnel(personnel)}
                            className={`cursor-pointer ${personnel.id === selectedPersonnelId ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                        >
                            <td className="border border-gray-400 px-2 py-1">{index + 1}</td>
                            <td className="border border-gray-400 px-2 py-1">{personnel.id}</td>
                            <td className="border border-gray-400 px-2 py-1">{personnel.sicilNo}</td>
                            <td className="border border-gray-400 px-2 py-1">{personnel.adSoyad}</td>
                            <td className="border border-gray-400 px-2 py-1">{personnel.gorevi}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{calculateTotalLeave(personnel)}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{getKesilenGun(personnel)}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{getKesilecekGun(personnel)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PersonnelTable;
