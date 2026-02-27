import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

interface PersianDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const jalaliMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const weekDayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// ===== Accurate Jalali <-> Gregorian Conversion (jalaali-js algorithm) =====

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  let jm: number, N: number, leapG: number;

  for (let i = 1; i < bl; i++) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
    if (i === bl - 1) jm = jy;
  }
  N = jy - jp;
  leapJ = leapJ + div(N, 33) * 8 + div(mod(N, 33) + 3, 4);
  if (mod(jump!, 33) === 4 && (jump! - N) === 4) leapJ++;
  const leapJ0 = mod(leapJ + 33, 33);
  const march = 20 + leapJ - div(leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150, 1);
  const mmmm = march + (leapG > 0 ? 0 : 0);

  // Note: using 'march' calculation from original algo
  return { leap: leapJ0, gy, march: mmmm };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd: number, jm: number, k: number;

  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function isJalaliLeap(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

function toJalali(gy: number, gm: number, gd: number) {
  return d2j(g2d(gy, gm, gd));
}

// Get the weekday index (0=Shanbe) for first day of Jalali month
function getFirstDayOfMonth(jy: number, jm: number): number {
  const jdn = j2d(jy, jm, 1);
  const g = d2g(jdn);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  let dow = d.getDay(); // 0=Sun, 6=Sat
  dow = (dow + 1) % 7;  // 0=Sat
  return dow;
}

// ===== Component =====

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  label,
  required = false,
  className = '',
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today in Jalali
  const today = new Date();
  const todayJ = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const parseValue = useCallback(() => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1300 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return { year: y, month: m, day: d };
        }
      }
    }
    return { year: todayJ.jy, month: todayJ.jm, day: todayJ.jd };
  }, [value, todayJ.jy, todayJ.jm, todayJ.jd]);

  const parsed = parseValue();
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [showMonths, setShowMonths] = useState(false);

  useEffect(() => {
    if (value) {
      const p = parseValue();
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value, parseValue]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowMonths(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const daysInMonth = jalaliMonthLength(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  const selectDay = (day: number) => {
    const formatted = `${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const isSelected = (day: number) =>
    parsed.year === viewYear && parsed.month === viewMonth && parsed.day === day;

  const isToday = (day: number) =>
    todayJ.jy === viewYear && todayJ.jm === viewMonth && todayJ.jd === day;

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const displayValue = value
    ? (() => {
        const p = parseValue();
        return `${p.day.toLocaleString('fa-IR')} ${jalaliMonthNames[p.month - 1]} ${p.year.toLocaleString('fa-IR')}`;
      })()
    : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-navy-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Trigger */}
      <div
        className="relative cursor-pointer"
        onClick={() => { setIsOpen(!isOpen); setShowMonths(false); }}
      >
        <input
          readOnly
          value={displayValue}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-navy-200 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition-all"
        />
        <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-navy-700' : 'text-navy-400'}`} />
        {value && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-navy-400 font-mono">
            {value}
          </span>
        )}
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[200] top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-navy-200 p-4 w-[310px]"
            style={{ direction: 'rtl' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Year Navigation */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                className="px-2 py-0.5 rounded-md text-[10px] text-navy-500 hover:bg-navy-100 transition-colors font-medium"
              >
                ‹ {(viewYear - 1).toLocaleString('fa-IR')}
              </button>
              <span className="px-3 py-1 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 text-white text-xs font-extrabold shadow-md">
                {viewYear.toLocaleString('fa-IR')}
              </span>
              <button
                type="button"
                onClick={() => setViewYear(y => y + 1)}
                className="px-2 py-0.5 rounded-md text-[10px] text-navy-500 hover:bg-navy-100 transition-colors font-medium"
              >
                {(viewYear + 1).toLocaleString('fa-IR')} ›
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-navy-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-navy-600" />
              </motion.button>
              <button
                type="button"
                onClick={() => setShowMonths(!showMonths)}
                className="text-sm font-extrabold text-navy-800 hover:text-blue-700 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                {jalaliMonthNames[viewMonth - 1]}
                <span className="text-[9px] text-navy-400 mr-1">{showMonths ? '▲' : '▼'}</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-navy-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-navy-600" />
              </motion.button>
            </div>

            {/* Month Quick Selection */}
            <AnimatePresence>
              {showMonths && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="grid grid-cols-4 gap-1 p-2 bg-navy-50 rounded-xl">
                    {jalaliMonthNames.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setViewMonth(i + 1); setShowMonths(false); }}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          viewMonth === i + 1
                            ? 'bg-navy-800 text-white shadow-sm'
                            : 'text-navy-600 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDayNames.map((name, i) => (
                <div
                  key={name + i}
                  className={`text-center text-[10px] font-bold py-1 ${
                    i === 6 ? 'text-red-400' : 'text-navy-400'
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div key={i} className="aspect-square">
                  {day ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => selectDay(day)}
                      className={`w-full h-full rounded-lg text-xs font-bold flex items-center justify-center transition-all relative ${
                        isSelected(day)
                          ? 'bg-gradient-to-br from-navy-700 to-navy-900 text-white shadow-lg shadow-navy-900/30 ring-2 ring-navy-400/30'
                          : isToday(day)
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 font-extrabold'
                          : (i % 7 === 6)
                          ? 'text-red-400 hover:bg-red-50'
                          : 'text-navy-700 hover:bg-navy-100'
                      }`}
                    >
                      {day.toLocaleString('fa-IR')}
                      {isToday(day) && !isSelected(day) && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                      )}
                    </motion.button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-navy-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewYear(todayJ.jy);
                  setViewMonth(todayJ.jm);
                  selectDay(todayJ.jd);
                }}
                className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-bold transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                <Calendar className="w-3 h-3" />
                امروز: {todayJ.jd.toLocaleString('fa-IR')} {jalaliMonthNames[todayJ.jm - 1]}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
