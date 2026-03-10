import { useState, useMemo } from 'react';
import { Calendar, CreditCard, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useRepairStore } from '../store/useRepairStore';
import type { Repair } from '../types/database';

// Helper to extract category from description exactly as in Repairs.tsx
function extractCategory(description?: string | null) {
    const catLabel = description?.split('\n').find(l => l.toLowerCase().startsWith('หมวดหมู่:'))?.replace('หมวดหมู่:', '').trim();
    const map: Record<string, string> = {
        'เครื่องยนต์': 'engine', 'เบรก': 'brakes', 'ยาง': 'tires', 'น้ำมัน': 'oil',
        'แบตเตอรี่': 'battery', 'แอร์': 'air', 'ตัวถัง/สี': 'body', 'ระบบไฟฟ้า': 'electric',
        'ช่วงล่าง': 'suspension', 'เกียร์': 'transmission', 'ตรวจเช็ค': 'checkup', 'อื่นๆ': 'other'
    };
    return catLabel && map[catLabel] ? map[catLabel] : 'other';
}

const categoryLabels: Record<string, string> = {
    'engine': 'เครื่องยนต์', 'brakes': 'เบรก', 'tires': 'ยาง', 'oil': 'น้ำมัน',
    'battery': 'แบตเตอรี่', 'air': 'แอร์', 'body': 'ตัวถัง/สี', 'electric': 'ระบบไฟฟ้า',
    'suspension': 'ช่วงล่าง', 'transmission': 'เกียร์', 'checkup': 'ตรวจเช็ค', 'other': 'อื่นๆ'
};

const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function Analytics() {
    const repairs = useRepairStore((state) => state.repairs);

    // Default to the current Buddhist Year
    const currentYear = new Date().getFullYear() + 543;
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedCar, setSelectedCar] = useState('all');

    // 1. Filter repairs based on year & selected car
    const { filteredRepairs, prevYearRepairs } = useMemo(() => {
        const targetYear = parseInt(selectedYear) - 543; // Convert back to AD

        const filtered = repairs.filter((r: Repair) => {
            const date = new Date(r.repair_date);
            const matchYear = date.getFullYear() === targetYear;
            const matchCar = selectedCar === 'all' || r.car_id === selectedCar;
            return matchYear && matchCar && r.status === 'completed';
        });

        const prevYear = repairs.filter((r: Repair) => {
            const date = new Date(r.repair_date);
            const matchYear = date.getFullYear() === targetYear - 1;
            const matchCar = selectedCar === 'all' || r.car_id === selectedCar;
            return matchYear && matchCar && r.status === 'completed';
        });

        return { filteredRepairs: filtered, prevYearRepairs: prevYear };
    }, [repairs, selectedYear, selectedCar]);

    const totalCost = filteredRepairs.reduce((sum: number, r: Repair) => sum + Number(r.cost), 0);
    const avgCostPerMonth = Math.round(totalCost / 12);
    const prevTotalCost = prevYearRepairs.reduce((sum: number, r: Repair) => sum + Number(r.cost), 0);

    // Calculate YoY change %
    const costChangePct = prevTotalCost > 0 ? Math.round(((totalCost - prevTotalCost) / prevTotalCost) * 100) : 0;
    const isCostUp = costChangePct > 0;

    // 2. Top Category Calculation
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        let count = 0;
        filteredRepairs.forEach((r: Repair) => {
            const cat = extractCategory(r.description);
            totals[cat] = (totals[cat] || 0) + Number(r.cost);
            count++;
        });

        const sortedCats = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        return {
            totals: sortedCats,
            topCategory: sortedCats.length > 0 ? categoryLabels[sortedCats[0][0]] || 'ไม่มีข้อมูล' : 'ไม่มีข้อมูล',
            categoryCount: Object.keys(totals).length
        };
    }, [filteredRepairs]);

    // 3. Monthly Comparison Chart Data
    const monthlyData = useMemo(() => {
        const currMonthTotals = new Array(12).fill(0);
        const prevMonthTotals = new Array(12).fill(0);

        filteredRepairs.forEach((r: Repair) => {
            const month = new Date(r.repair_date).getMonth();
            currMonthTotals[month] += Number(r.cost);
        });

        prevYearRepairs.forEach((r: Repair) => {
            const month = new Date(r.repair_date).getMonth();
            prevMonthTotals[month] += Number(r.cost);
        });

        const maxCost = Math.max(...currMonthTotals, ...prevMonthTotals, 1); // Avoid div zero

        return monthLabels.map((month, index) => ({
            month,
            currCost: currMonthTotals[index],
            prevCost: prevMonthTotals[index],
            currPct: `${Math.round((currMonthTotals[index] / maxCost) * 100)}%`,
            prevPct: `${Math.round((prevMonthTotals[index] / maxCost) * 100)}%`
        }));
    }, [filteredRepairs, prevYearRepairs]);

    // 4. Expense by Vehicle Chart Data
    const vehicleTotals = useMemo(() => {
        const totals: Record<string, { cost: number, car: NonNullable<Repair['cars']> }> = {};
        filteredRepairs.forEach((r: Repair) => {
            if (!r.cars) return;
            if (!totals[r.car_id]) totals[r.car_id] = { cost: 0, car: r.cars };
            totals[r.car_id].cost += Number(r.cost);
        });

        const sorted = Object.values(totals).sort((a, b) => b.cost - a.cost);
        // Take top 3
        const maxCarCost = sorted.length > 0 ? sorted[0].cost : 1;

        return sorted.slice(0, 3).map(v => ({
            name: `${v.car.brand} ${v.car.model} (${v.car.plate_number})`,
            cost: v.cost,
            pct: `${Math.round((v.cost / maxCarCost) * 100)}%` // Relative to max for bar width
        }));
    }, [filteredRepairs]);

    // Ensure cars are uniquely listed for dropdown
    const uniqueCars = Array.from(new Map(repairs.filter((r: Repair) => r.cars).map((r: Repair) => [r.cars!.id, r.cars])).values()) as NonNullable<Repair['cars']>[];

    // Compute top 4 categories for Donut chart and list
    const top4Categories = categoryTotals.totals.slice(0, 4);
    const categoryColors = ['bg-primary-500', 'bg-emerald-500', 'bg-orange-500', 'bg-slate-400 dark:bg-slate-600'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">สถิติและวิเคราะห์</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">ข้อมูลสรุปค่าใช้จ่ายและการซ่อมบำรุงรายปี</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">เลือกปี</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        >
                            <option value={currentYear.toString()}>{currentYear}</option>
                            <option value={(currentYear - 1).toString()}>{currentYear - 1}</option>
                            <option value={(currentYear - 2).toString()}>{currentYear - 2}</option>
                            <option value={(currentYear - 3).toString()}>{currentYear - 3}</option>
                            <option value={(currentYear - 4).toString()}>{currentYear - 4}</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-[2] min-w-[180px]">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">เลือกยานพาหนะ</label>
                        <select
                            value={selectedCar}
                            onChange={(e) => setSelectedCar(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        >
                            <option value="all">รถยนต์ทั้งหมด</option>
                            {uniqueCars.map((car, i) => (
                                <option key={car?.id || i} value={car?.id}>
                                    {car?.brand} {car?.model} ({car?.plate_number})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                            <CreditCard size={24} />
                        </div>
                        {prevTotalCost > 0 && (
                            <span className={`${isCostUp ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'} px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1`}>
                                {isCostUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {Math.abs(costChangePct)}%
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">ค่าใช้จ่ายทั้งหมด (ปี {selectedYear})</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">฿{totalCost.toLocaleString()}</h3>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">ค่าใช้จ่ายเฉลี่ยต่อเดือน</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">฿{avgCostPerMonth.toLocaleString()}</h3>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                            <Tag size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">หมวดหมู่ค่าใช้จ่ายสูงสุด</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">{categoryTotals.topCategory}</h3>
                </div>
            </div>

            {/* Row 2: Large Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">เปรียบเทียบค่าใช้จ่ายรายเดือน</h4>
                    <div className="flex gap-4 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="w-3 h-3 rounded-full bg-primary-500 shadow-sm"></span>
                            <span className="text-slate-700 dark:text-slate-300">{selectedYear}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 shadow-sm"></span>
                            <span className="text-slate-700 dark:text-slate-300">{parseInt(selectedYear) - 1}</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 flex items-end gap-2 md:gap-4 px-2 overflow-x-auto custom-scrollbar pb-4 -mb-4">
                    {monthlyData.map((data, i: number) => (
                        <div key={i} className="flex-1 min-w-[32px] flex flex-col justify-end items-center gap-2 h-full group">
                            <div className="flex items-end gap-1 md:gap-1.5 w-full justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className="w-3 md:w-5 bg-slate-300 dark:bg-slate-700 rounded-t-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors cursor-pointer" style={{ height: data.prevPct }} title={`ปีที่แล้ว: ฿${data.prevCost.toLocaleString()}`}></div>
                                <div className="w-3 md:w-5 bg-primary-500 rounded-t-md hover:bg-primary-400 transition-colors cursor-pointer" style={{ height: data.currPct }} title={`ปีนี้: ฿${data.currCost.toLocaleString()}`}></div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{data.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Row 3: Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Left: Component Breakdown (Using flex bars since Donut CSS is hard to make dynamic without an SVG library) */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h4 className="font-bold text-lg mb-8 text-slate-900 dark:text-white">ค่าใช้จ่ายตามหมวดหมู่</h4>

                    {top4Categories.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-10 flex-1 justify-center w-full">
                            {/* Simple CSS radial ring representing data visually */}
                            <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                                {top4Categories.map(() => {
                                    // A very basic approximation using conic-gradient for simplicity without adding charting libraries
                                    return null; // Conic gradient handled on parent
                                })}
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `conic-gradient(${top4Categories.map((_cat: [string, number], i: number) => {
                                            const startPct = top4Categories.slice(0, i).reduce((s: number, c: [string, number]) => s + c[1], 0) / (totalCost || 1) * 100;
                                            const endPct = top4Categories.slice(0, i + 1).reduce((s: number, c: [string, number]) => s + c[1], 0) / (totalCost || 1) * 100;
                                            return `${categoryColors[i % categoryColors.length].replace('bg-', '#').replace('dark:bg-slate-600', '#475569')} ${startPct}% ${endPct}%`;
                                        }).join(', ')})`
                                    }}
                                ></div>
                                <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 w-32 h-32 rounded-full z-10">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-0.5">ทั้งหมด</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white text-center pb-2">{categoryTotals.categoryCount} หมวด</span>
                                </div>
                            </div>

                            <div className="w-full sm:flex-1 grid grid-cols-1 gap-4">
                                {top4Categories.map((cat: any, i: number) => (
                                    <div key={cat[0]} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-3.5 h-3.5 rounded-full ${categoryColors[i % categoryColors.length]} shadow-sm`}></span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{categoryLabels[cat[0]] || cat[0]}</span>
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white shrink-0">
                                            {Math.round((cat[1] / totalCost) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">ไม่มีข้อมูลหมวดหมู่การซ่อมในปีนี้</div>
                    )}
                </div>

                {/* Right: Bar Chart - Expense by Vehicle */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">ค่าใช้จ่ายแบ่งตามรถยนต์สูงสุด</h4>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {vehicleTotals.length > 0 ? vehicleTotals.map((v: any, i: number) => {
                            const barColors = ['from-primary-600 to-primary-400', 'from-emerald-500 to-emerald-400', 'from-orange-500 to-orange-400'];
                            return (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-end mb-2 gap-4">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate" title={v.name}>{v.name}</span>
                                        <span className="text-sm font-black text-primary-600 dark:text-primary-400 shrink-0">฿{v.cost.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-3 md:h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                        <div
                                            className={`h-full bg-gradient-to-r ${barColors[i % barColors.length]} rounded-full group-hover:opacity-90 transition-all duration-1000 relative`}
                                            style={{ width: v.pct }}
                                        >
                                            {i === 0 && <div className="absolute inset-0 bg-white/20 w-1/4 skew-x-12 translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]"></div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500">ไม่มีข้อมูลค่าใช้จ่ายรถยนต์ในปีนี้</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
