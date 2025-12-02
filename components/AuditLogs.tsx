
import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/databaseService';
import { AuditLog } from '../types';

interface AuditLogsProps {
    onClose: () => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLogs(DatabaseService.getAuditLogs());
    }, []);

    const filteredLogs = logs.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        switch(action) {
            case 'CREATE': return 'text-green-600 bg-green-100';
            case 'DELETE': return 'text-red-600 bg-red-100';
            case 'UPDATE': return 'text-blue-600 bg-blue-100';
            case 'LOGIN': return 'text-purple-600 bg-purple-100';
            case 'IMPORT': return 'text-amber-600 bg-amber-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Sistem Denetim Kayıtları (Audit Log)</h2>
                        <p className="text-xs text-slate-500">Tüm kullanıcı hareketleri ve veri değişiklikleri</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b bg-white">
                    <input 
                        type="text" 
                        placeholder="Kayıtlar içinde ara (Kullanıcı, İşlem, Detay)..." 
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 bg-slate-50">
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                                <tr>
                                    <th className="p-3">Zaman</th>
                                    <th className="p-3">Kullanıcı</th>
                                    <th className="p-3">İşlem</th>
                                    <th className="p-3">Hedef</th>
                                    <th className="p-3">Detaylar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-slate-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-3 font-medium text-slate-700">{log.user}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-600">{log.target}</td>
                                        <td className="p-3 text-slate-500 max-w-md truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
