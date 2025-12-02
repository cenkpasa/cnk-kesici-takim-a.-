
import React, { useState, useEffect, useRef } from 'react';
import { DatabaseService } from '../services/databaseService';
import type { Personnel, TimeLog } from '../types';

interface DeviceIntegrationProps {
    onClose: () => void;
    onUpdate: () => void;
    allPersonnel: Personnel[];
}

const DeviceIntegration: React.FC<DeviceIntegrationProps> = ({ onClose, onUpdate, allPersonnel }) => {
    const [mode, setMode] = useState<'simulation' | 'real'>('simulation');
    
    // Connection Config
    const [ipAddress, setIpAddress] = useState('192.168.1.224');
    const [port, setPort] = useState('5005');
    
    // Status
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [proxyStatus, setProxyStatus] = useState<'disconnected' | 'connected'>('disconnected');
    const [logs, setLogs] = useState<string[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // WebSocket for Real Connection
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Clean up WS on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    // --- REAL CONNECTION LOGIC ---
    const connectToProxy = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket('ws://localhost:8080');
            
            ws.onopen = () => {
                setProxyStatus('connected');
                addLog('Köprü sunucusuna (Proxy) bağlanıldı.');
            };

            ws.onclose = () => {
                setProxyStatus('disconnected');
                setStatus('disconnected');
                addLog('Köprü sunucusu bağlantısı koptu. (node proxy-server.js çalışıyor mu?)');
            };

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    
                    if (response.type === 'STATUS') {
                        setStatus(response.status === 'CONNECTED' ? 'connected' : 'disconnected');
                        addLog(`Cihaz Durumu: ${response.status}`);
                    }
                    if (response.type === 'DATA') {
                        addLog(`VERİ GELDİ: ${response.data.substring(0, 50)}...`);
                        handleRealDataReceive(response.data);
                    }
                    if (response.type === 'ERROR') {
                        addLog(`HATA: ${response.message}`);
                        setStatus('disconnected');
                    }
                } catch (e) {
                    console.error("WS Message Error", e);
                }
            };

            wsRef.current = ws;
        } catch (e) {
            addLog('Proxy sunucusuna bağlanılamadı.');
        }
    };

    const handleRealConnect = () => {
        if (proxyStatus !== 'connected') {
            connectToProxy();
            return;
        }

        if (status === 'connected') {
            wsRef.current?.send(JSON.stringify({ command: 'DISCONNECT' }));
        } else {
            addLog(`Cihaza bağlanılıyor: ${ipAddress}:${port}...`);
            wsRef.current?.send(JSON.stringify({ 
                command: 'CONNECT', 
                ip: ipAddress, 
                port: port 
            }));
        }
    };

    const handleRealDataReceive = (base64Data: string) => {
        addLog("Veri paketi işleniyor...");
        // Here you would implement parsing logic for the specific device protocol (e.g., ZK protocols)
    };

    // --- SIMULATION LOGIC ---
    const handleSimulatedConnect = () => {
        if (status === 'connected') {
            setStatus('disconnected');
            addLog('Bağlantı kesildi.');
            return;
        }

        setStatus('connecting');
        addLog(`${ipAddress}:${port} adresine bağlanılıyor (Simülasyon)...`);

        setTimeout(() => {
            setStatus('connected');
            addLog('Bağlantı başarılı! Cihaz: ZKTeco iFace Series (SIM)');
            addLog('Cihaz Durumu: Hazır, Hafızada okunamayan kayıtlar var.');
        }, 1500);
    };

    const handleFetchData = () => {
        if (status !== 'connected') return;

        setIsSyncing(true);
        
        if (mode === 'real') {
             addLog('Cihazdan veri talep ediliyor...');
             wsRef.current?.send(JSON.stringify({ 
                 command: 'SEND', 
                 payload: 'DATA_REQUEST' 
             }));
             
             setTimeout(() => {
                 addLog('Uyarı: Cihaz protokolü tam eşleşmediği için ham veri okunamadı.');
                 setIsSyncing(false);
             }, 2000);
             return;
        }

        // Simulation Fetch
        addLog('Cihaz hafızasındaki kayıtlar taranıyor...');
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            const newLogs: Omit<TimeLog, 'id'>[] = [];
            let count = 0;

            allPersonnel.forEach(p => {
                // Check if user already has a log for today, if so, skip (or maybe update)
                const hasLogToday = p.timeLogs?.some(l => l.date === today);
                
                // Simulate randomness: 70% chance to fetch a log if missing
                if (!hasLogToday && Math.random() > 0.3) {
                    const inHour = 8;
                    const inMin = Math.floor(Math.random() * 59);
                    const checkIn = `${inHour.toString().padStart(2, '0')}:${inMin.toString().padStart(2, '0')}`;
                    
                    // Simulate random checkout for demo purposes (usually fetch brings checkout separately)
                    const outHour = 18;
                    const outMin = Math.floor(Math.random() * 59);
                    const checkOut = `${outHour.toString().padStart(2, '0')}:${outMin.toString().padStart(2, '0')}`;
                    
                    newLogs.push({ personnelId: p.id, date: today, checkIn, checkOut });
                    count++;
                    addLog(`OKUNDU: [ID:${p.id}] ${p.adSoyad} -> ${checkIn} / ${checkOut}`);
                }
            });

            if (count > 0) {
                DatabaseService.addTimeLogsBatch(newLogs);
                addLog(`TOPLAM: ${count} adet yeni kayıt veritabanına aktarıldı.`);
                onUpdate();
            } else {
                addLog('Aktarılacak yeni kayıt bulunamadı veya tüm personellerin girişi zaten yapılmış.');
            }
            setIsSyncing(false);
        }, 2500);
    };

    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300">
                <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Parmak İzi Okuyucu Entegrasyonu</h3>
                    <button onClick={onClose} className="text-white hover:bg-red-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold text-xl">&times;</button>
                </div>
                
                <div className="bg-slate-100 border-b border-slate-200 flex text-sm p-2 gap-2">
                    <button 
                        onClick={() => { setMode('simulation'); setStatus('disconnected'); }}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all font-semibold ${mode === 'simulation' ? 'bg-white text-teal-700 border border-teal-500 shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        Simülasyon Modu
                    </button>
                    <button 
                        onClick={() => { setMode('real'); setStatus('disconnected'); connectToProxy(); }}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all font-semibold ${mode === 'real' ? 'bg-white text-teal-700 border border-teal-500 shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        Gerçek Bağlantı (Köprü)
                    </button>
                </div>

                <div className="p-6 space-y-6 bg-white min-h-[350px]">
                    
                    {mode === 'real' && (
                        <div className={`p-3 rounded border text-sm flex items-center justify-between ${proxyStatus === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div>
                                <strong>Köprü (Proxy) Durumu:</strong> {proxyStatus === 'connected' ? 'BAĞLI' : 'BAĞLI DEĞİL'}
                                {proxyStatus !== 'connected' && (
                                    <p className="text-xs mt-1 opacity-80">Lütfen terminalde <code>node proxy-server.js</code> çalıştırın.</p>
                                )}
                            </div>
                            <div className={`w-3 h-3 rounded-full ${proxyStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        </div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                        <h3 className="text-xs font-bold mb-3 text-slate-500 uppercase tracking-wider">CİHAZ AYARLARI ({mode === 'real' ? 'GERÇEK' : 'SANAL'})</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="block text-slate-700 font-bold text-xs mb-1">IP Adresi</label>
                                <input 
                                    type="text" 
                                    value={ipAddress} 
                                    onChange={e => setIpAddress(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                    disabled={status === 'connected'}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-700 font-bold text-xs mb-1">Port</label>
                                <input 
                                    type="text" 
                                    value={port} 
                                    onChange={e => setPort(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                    disabled={status === 'connected'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button 
                            onClick={mode === 'real' ? handleRealConnect : handleSimulatedConnect}
                            disabled={mode === 'real' && proxyStatus !== 'connected'}
                            className={`flex-1 px-4 py-3 font-bold text-sm rounded shadow-lg text-white transition-colors flex justify-center items-center gap-2 ${btn3dClasses}
                                ${status === 'connected' 
                                    ? 'bg-red-500 border border-red-700 hover:bg-red-600' 
                                    : (mode === 'real' && proxyStatus !== 'connected' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 border border-green-800 hover:bg-green-700')
                                }`}
                        >
                            <span className="text-lg">{status === 'connected' ? '🔌' : '🔗'}</span>
                            {status === 'connected' ? 'BAĞLANTIYI KES' : 'CİHAZA BAĞLAN'}
                        </button>
                        
                        <button 
                            onClick={handleFetchData}
                            disabled={status !== 'connected' || isSyncing}
                            className={`flex-1 px-4 py-3 font-bold text-sm rounded shadow-lg text-white transition-colors flex justify-center items-center gap-2 ${btn3dClasses}
                                ${status !== 'connected' || isSyncing
                                    ? 'bg-gray-400 border border-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 border border-blue-800 hover:bg-blue-700'
                                }`}
                        >
                            <span className="text-lg">{isSyncing ? '⏳' : '📥'}</span>
                            {isSyncing ? 'VERİLER ÇEKİLİYOR...' : 'VERİLERİ AKTAR'}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500">CİHAZ LOGLARI</span>
                            {logs.length > 0 && <button onClick={clearLogs} className="text-xs text-red-500 hover:underline">Temizle</button>}
                        </div>
                        <div className="border border-slate-300 rounded bg-slate-900 text-green-400 font-mono text-xs h-40 overflow-y-auto shadow-inner p-3 custom-scrollbar">
                            {logs.length === 0 && <p className="opacity-50 italic text-center mt-10">Bağlantı bekleniyor...</p>}
                            {logs.map((log, i) => (
                                <div key={i} className="border-b border-slate-800 last:border-0 pb-1 mb-1 break-all">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceIntegration;
