
import React, { useState, useEffect } from 'react';
import { Personnel } from '../types';
import { DatabaseService } from '../services/databaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
    personnelList: Personnel[];
}

interface DeptStat {
    name: string;
    count: number;
    percent: number;
}

interface ActivityLog {
    id: string;
    name: string;
    action: 'Giriş' | 'Çıkış';
    time: string;
    status: 'normal' | 'late' | 'early';
}

const Dashboard: React.FC<DashboardProps> = ({ personnelList }) => {
    const [stats, setStats] = useState({ 
        present: 0, 
        late: 0, 
        absent: 0, 
        total: 0,
        attendanceRate: 0
    });
    const [departmentStats, setDepartmentStats] = useState<DeptStat[]>([]);
    const [latePersonnel, setLatePersonnel] = useState<{name: string, time: string, gorev: string}[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const calculateStats = () => {
            const settings = DatabaseService.getSettings(); // Get dynamic settings
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Parse work start time from settings
            const [startH, startM] = settings.workStartTime.split(':').map(Number);
            
            let present = 0, late = 0, absent = 0;
            const lateList: {name: string, time: string, gorev: string}[] = [];
            const activityList: ActivityLog[] = [];
            const deptMap: Record<string, number> = {};

            personnelList.forEach(p => {
                // Department Stats
                const dept = p.gorevi || 'Diğer';
                deptMap[dept] = (deptMap[dept] || 0) + 1;

                // Log Logic
                const log = p.timeLogs?.find(l => l.date === todayStr);
                if (log) {
                    present++;
                    const [h, m] = log.checkIn.split(':').map(Number);
                    
                    // Late check logic
                    let isLate = false;
                    if (h > startH || (h === startH && m > startM)) {
                        late++;
                        isLate = true;
                        lateList.push({
                            name: p.adSoyad,
                            time: log.checkIn,
                            gorev: p.gorevi
                        });
                    }

                    activityList.push({
                        id: log.id,
                        name: p.adSoyad,
                        action: 'Giriş',
                        time: log.checkIn,
                        status: isLate ? 'late' : 'normal'
                    });
                    
                    if (log.checkOut) {
                        // Assuming checkout > 18:00 is normal, < 18:00 is early (simplified)
                         activityList.push({
                            id: log.id + '_out',
                            name: p.adSoyad,
                            action: 'Çıkış',
                            time: log.checkOut,
                            status: 'normal'
                        });
                    }

                } else {
                    absent++;
                }
            });

            // Sort Activity by time desc
            activityList.sort((a, b) => b.time.localeCompare(a.time));

            // Dept Stats for Chart
            const totalP = personnelList.length || 1;
            const deptStatsArr = Object.entries(deptMap)
                .map(([name, count]) => ({
                    name,
                    count,
                    percent: Math.round((count / totalP) * 100)
                }))
                .sort((a, b) => b.count - a.count);

            setStats({ 
                present, 
                late, 
                absent, 
                total: personnelList.length,
                attendanceRate: Math.round((present / totalP) * 100)
            });
            setDepartmentStats(deptStatsArr);
            setLatePersonnel(lateList);
            setRecentActivity(activityList.slice(0, 10)); // Last 10 actions
            setLastUpdated(new Date());
        };

        calculateStats();
        const interval = setInterval(calculateStats, 60000);
        return () => clearInterval(interval);
    }, [personnelList]);

    // --- SVG Donut Chart Helper ---
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const presentOffset = circumference - (stats.attendanceRate / 100) * circumference;
    const lateRate = stats.present > 0 ? Math.round((stats.late / stats.total) * 100) : 0;
    const lateOffset = circumference - (lateRate / 100) * circumference;

    // Color logic for attendance bar
    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return 'bg-emerald-500';
        if (rate >= 70) return 'bg-yellow-400';
        return 'bg-red-500';
    };
    const attendanceColor = getAttendanceColor(stats.attendanceRate);

    return (
        <div className="p-6 bg-slate-50 min-h-full font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Genel Bakış</h2>
                    <p className="text-sm text-slate-500">Canlı İstatistikler • {lastUpdated.toLocaleTimeString('tr-TR')}</p>
                </div>
            </div>

            {/* TOP KPI CARDS - Enhanced with Hover Effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1: Total Personnel */}
                <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">👥</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Toplam Personel</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{stats.total}</h3>
                    <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                        <span className="bg-green-100 px-2 py-1 rounded-full group-hover:bg-green-200 transition-colors">Aktif</span>
                    </div>
                </div>

                {/* Card 2: Productivity/Attendance Score */}
                <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">📈</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Katılım Oranı</p>
                    <h3 className={`text-3xl font-extrabold ${stats.attendanceRate >= 90 ? 'text-emerald-600' : 'text-indigo-600'}`}>%{stats.attendanceRate}</h3>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all duration-1000 ${attendanceColor}`} style={{ width: `${stats.attendanceRate}%` }}></div>
                    </div>
                </div>

                {/* Card 3: Late Arrivals */}
                <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">⚠️</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Geç Kalanlar</p>
                    <h3 className="text-3xl font-extrabold text-amber-500">{stats.late}</h3>
                    <p className="mt-4 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">Bugün 08:45 sonrası</p>
                </div>

                {/* Card 4: Absent */}
                <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🚫</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Gelmeyenler</p>
                    <h3 className="text-3xl font-extrabold text-rose-500">{stats.absent}</h3>
                    <p className="mt-4 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">Henüz giriş yapmadı</p>
                </div>
            </div>

            {/* MIDDLE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Chart Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-slate-700 font-bold text-sm mb-6 self-start w-full border-b pb-2">Günlük Katılım Grafiği</h3>
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle
                                cx="50%" cy="50%" r={radius}
                                stroke="#f1f5f9" strokeWidth="10" fill="transparent"
                            />
                            {/* Present Circle (Green) */}
                            <circle
                                cx="50%" cy="50%" r={radius}
                                stroke="#10b981" strokeWidth="10" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={presentOffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                            {/* Late Circle (Amber) - Overlaying part of Green for visualization */}
                            <circle
                                cx="50%" cy="50%" r={radius}
                                stroke="#f59e0b" strokeWidth="10" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={lateOffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out opacity-80"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800">{stats.present}</span>
                            <span className="text-xs text-slate-500 uppercase">Personel</span>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6 text-xs font-medium">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Gelen</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span> Geç</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-200 shadow-sm"></span> Yok</div>
                    </div>
                </div>

                {/* Department Stats (Recharts Bar Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-slate-700 font-bold text-sm mb-6 border-b pb-2">Personel Dağılımı (Görev Bazlı)</h3>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={departmentStats}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#64748b'}} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20}>
                                    {departmentStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0d9488' : '#0f766e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Late Arrivals List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-slate-700 font-bold text-sm mb-4 flex justify-between items-center border-b pb-2">
                        <span>Geç Kalanlar</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">{latePersonnel.length} Kişi</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '250px' }}>
                        {latePersonnel.length > 0 ? (
                            <div className="space-y-3">
                                {latePersonnel.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-amber-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                                {p.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{p.name}</p>
                                                <p className="text-[10px] text-slate-500">{p.gorev}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-amber-600 bg-white border border-amber-100 px-2 py-1 rounded shadow-sm">
                                            {p.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <span className="text-4xl mb-2">👏</span>
                                <p className="text-xs">Bugün geç kalan yok!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: Recent Activity */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="text-slate-700 font-bold text-sm mb-4 border-b pb-2">Son Hareketler (Canlı Akış)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-semibold">Personel</th>
                                <th className="pb-3 font-semibold">İşlem</th>
                                <th className="pb-3 font-semibold">Saat</th>
                                <th className="pb-3 font-semibold text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600">
                            {recentActivity.map((act, idx) => (
                                <tr key={act.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 font-medium">{act.name}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${act.action === 'Giriş' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {act.action}
                                        </span>
                                    </td>
                                    <td className="py-3 font-mono text-xs">{act.time}</td>
                                    <td className="py-3 text-right">
                                        {act.status === 'late' ? (
                                            <span className="text-xs font-bold text-amber-600 flex items-center justify-end gap-1">
                                                ⚠️ Geç
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                                                ✓ Zamanında
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {recentActivity.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">Henüz hareket yok.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
