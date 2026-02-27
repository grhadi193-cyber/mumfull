export interface Session {
  id: string;
  date: string;
  time: string;
  type: string;
  notes: string;
  referrals: Referral[];
}

export interface Referral {
  id: string;
  target: string;
  reason: string;
  date: string;
  status: 'pending' | 'completed' | 'in_progress';
  confirmedDate?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  username: string;
  password: string;
  gpa: number;
  phoneNumber: string;
  advisorId: string;
  advisorName: string;
  semester: string;
  totalSessions: number;
  role: 'student';
  studentType?: 'normal' | 'international' | 'quota';
  sessions: Session[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DayAvailability {
  day: string;
  slots: TimeSlot[];
}

export interface Advisor {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: 'advisor';
  specialty?: string;
  faculty?: string;
  availability: DayAvailability[];
}

export interface AppointmentType {
  label: string;
  value: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  advisorId: string;
  date: string;
  time: string;
  appointmentType: AppointmentType;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  department?: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  replies: MessageReply[];
}

export interface MessageReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  role: 'admin';
  firstName: string;
  lastName: string;
}

export interface SpecialRole {
  id: string;
  username: string;
  password: string;
  role: 'counseling_center' | 'education_admin' | 'advisor_supervisor' | 'department_head';
  firstName: string;
  lastName: string;
  title: string;
}

export const referralTargets = [
  { label: 'کلینیک مشاوره', value: 'کلینیک مشاوره', icon: '🧠', color: 'from-purple-500 to-purple-600', role: 'counseling_center' },
  { label: 'مسئول اساتید مشاور', value: 'مسئول اساتید مشاور', icon: '👨‍💼', color: 'from-blue-500 to-blue-600', role: 'advisor_supervisor' },
  { label: 'مسئول آموزش', value: 'مسئول آموزش', icon: '📚', color: 'from-emerald-500 to-emerald-600', role: 'education_admin' },
  { label: 'مدیرگروه', value: 'مدیرگروه', icon: '🏛️', color: 'from-amber-500 to-amber-600', role: 'department_head' },
];

export const messageDepartments = [
  { label: 'استاد مشاور', value: 'advisor', icon: '👨‍🏫', color: 'from-navy-600 to-navy-800' },
  { label: 'مشاوره', value: 'مشاوره', icon: '🧠', color: 'from-purple-500 to-purple-600' },
  { label: 'مسئول مشاور', value: 'مسئول مشاور', icon: '👨‍💼', color: 'from-blue-500 to-blue-600' },
  { label: 'آموزش', value: 'آموزش', icon: '📚', color: 'from-emerald-500 to-emerald-600' },
  { label: 'مدیر گروه', value: 'مدیر گروه', icon: '🏛️', color: 'from-amber-500 to-amber-600' },
  { label: 'مدیر سیستم', value: 'admin', icon: '⚙️', color: 'from-red-500 to-red-600' },
];

const defaultTimeSlots: TimeSlot[] = [
  { time: "08:00-09:00", available: true },
  { time: "09:00-10:00", available: true },
  { time: "10:00-11:00", available: true },
  { time: "11:00-12:00", available: true },
  { time: "13:00-14:00", available: true },
  { time: "14:00-15:00", available: true },
  { time: "15:00-16:00", available: false },
  { time: "16:00-17:00", available: false },
];

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];

export const initialAdmins: Admin[] = [
  {
    id: "admin1",
    username: "admin",
    password: "admin123",
    role: "admin",
    firstName: "مدیر",
    lastName: "سیستم",
  },
];

export const initialSpecialRoles: SpecialRole[] = [
  {
    id: "counseling1",
    username: "counseling",
    password: "123456",
    role: "counseling_center",
    firstName: "مرکز",
    lastName: "مشاوره",
    title: "مرکز مشاوره دانشگاه",
  },
  {
    id: "education1",
    username: "education",
    password: "123456",
    role: "education_admin",
    firstName: "مسئول",
    lastName: "آموزش",
    title: "مسئول آموزش دانشکده",
  },
  {
    id: "supervisor1",
    username: "supervisor",
    password: "123456",
    role: "advisor_supervisor",
    firstName: "مسئول",
    lastName: "اساتید مشاور",
    title: "مسئول اساتید مشاور",
  },
  {
    id: "depthead1",
    username: "depthead",
    password: "123456",
    role: "department_head",
    firstName: "مدیر",
    lastName: "گروه",
    title: "مدیر گروه آموزشی",
  },
];

export const initialAdvisors: Advisor[] = [
  {
    id: "advisor1",
    firstName: "محمد",
    lastName: "رضایی",
    username: "advisor1",
    password: "123456",
    role: "advisor",
    specialty: "مشاوره تحصیلی",
    faculty: "پزشکی",
    availability: days.map(day => ({
      day,
      slots: defaultTimeSlots.map(s => ({ ...s })),
    })),
  },
  {
    id: "advisor2",
    firstName: "فاطمه",
    lastName: "محمدی",
    username: "advisor2",
    password: "123456",
    role: "advisor",
    specialty: "روانشناسی بالینی",
    faculty: "بهداشت",
    availability: days.map(day => ({
      day,
      slots: defaultTimeSlots.map(s => ({ ...s, available: day !== "چهارشنبه" ? s.available : false })),
    })),
  },
  {
    id: "advisor3",
    firstName: "حسین",
    lastName: "کریمی",
    username: "advisor3",
    password: "123456",
    role: "advisor",
    specialty: "مشاوره شغلی",
    faculty: "داروسازی",
    availability: days.map(day => ({
      day,
      slots: defaultTimeSlots.map(s => ({ ...s })),
    })),
  },
];

export const initialStudents: Student[] = [
  {
    id: "student1",
    firstName: "علی",
    lastName: "احمدی",
    studentNumber: "9912345",
    username: "student1",
    password: "123456",
    gpa: 17.5,
    phoneNumber: "09121234567",
    advisorId: "advisor1",
    advisorName: "دکتر محمد رضایی",
    semester: "1404-1",
    totalSessions: 3,
    role: "student",
    studentType: "normal",
    sessions: [
      { id: "s1-1", date: "1404/08/15", time: "10:00", type: "بررسی آموزشی", notes: "بررسی وضعیت تحصیلی ترم جاری", referrals: [] },
      { id: "s1-2", date: "1404/09/10", time: "09:00", type: "بررسی آموزشی، بررسی پژوهشی", notes: "انتخاب واحد ترم آینده", referrals: [{ id: "ref1", target: "کلینیک مشاوره", reason: "نیاز به مشاوره تخصصی روانشناسی", date: "1404/09/10", status: "completed", confirmedDate: "1404/09/15" }] },
      { id: "s1-3", date: "1404/10/05", time: "11:00", type: "بررسی آموزشی", notes: "بررسی نمرات میان‌ترم", referrals: [] },
    ],
  },
  {
    id: "student2",
    firstName: "زهرا",
    lastName: "موسوی",
    studentNumber: "9912346",
    username: "student2",
    password: "123456",
    gpa: 18.2,
    phoneNumber: "09131234567",
    advisorId: "advisor1",
    advisorName: "دکتر محمد رضایی",
    semester: "1404-1",
    totalSessions: 2,
    role: "student",
    studentType: "normal",
    sessions: [
      { id: "s2-1", date: "1404/08/20", time: "10:00", type: "بررسی آموزشی", notes: "برنامه‌ریزی تحصیلی", referrals: [] },
      { id: "s2-2", date: "1404/09/15", time: "14:00", type: "بررسی پژوهشی", notes: "مشاوره پایان‌نامه", referrals: [{ id: "ref2", target: "مسئول آموزش", reason: "بررسی وضعیت واحدهای گذرانده", date: "1404/09/15", status: "pending" }] },
    ],
  },
  {
    id: "student3",
    firstName: "رضا",
    lastName: "حسینی",
    studentNumber: "9912347",
    username: "student3",
    password: "123456",
    gpa: 11.5,
    phoneNumber: "09141234567",
    advisorId: "advisor2",
    advisorName: "دکتر فاطمه محمدی",
    semester: "1404-1",
    totalSessions: 4,
    role: "student",
    studentType: "normal",
    sessions: [
      { id: "s3-1", date: "1404/07/10", time: "09:00", type: "بررسی مشروطی، اعلام وضعیت روانی و خانوادگی", notes: "جلسه اول مشاوره", referrals: [] },
      { id: "s3-2", date: "1404/08/08", time: "09:00", type: "بررسی افت تحصیلی", notes: "پیگیری جلسه قبل", referrals: [] },
      { id: "s3-3", date: "1404/09/05", time: "10:00", type: "بررسی مشروطی", notes: "بررسی وضعیت درسی", referrals: [{ id: "ref3", target: "مسئول اساتید مشاور", reason: "وضعیت تحصیلی بحرانی", date: "1404/09/05", status: "in_progress" }] },
      { id: "s3-4", date: "1404/10/01", time: "11:00", type: "بررسی افت تحصیلی، بررسی مشروطی", notes: "جلسه پیگیری", referrals: [{ id: "ref3b", target: "کلینیک مشاوره", reason: "ارجاع روانشناسی", date: "1404/10/01", status: "pending" }] },
    ],
  },
  {
    id: "student4",
    firstName: "مریم",
    lastName: "کاظمی",
    studentNumber: "9912348",
    username: "student4",
    password: "123456",
    gpa: 19.1,
    phoneNumber: "09151234567",
    advisorId: "advisor2",
    advisorName: "دکتر فاطمه محمدی",
    semester: "1404-1",
    totalSessions: 1,
    role: "student",
    studentType: "normal",
    sessions: [
      { id: "s4-1", date: "1404/09/20", time: "13:00", type: "بررسی آموزشی، مشورت شغلی", notes: "مشاوره ادامه تحصیل", referrals: [{ id: "ref4", target: "مدیرگروه", reason: "درخواست تغییر رشته", date: "1404/09/20", status: "pending" }] },
    ],
  },
  {
    id: "student5",
    firstName: "امیر",
    lastName: "نوری",
    studentNumber: "9912349",
    username: "student5",
    password: "123456",
    gpa: 13.3,
    phoneNumber: "09161234567",
    advisorId: "advisor3",
    advisorName: "دکتر حسین کریمی",
    semester: "1404-1",
    totalSessions: 2,
    role: "student",
    studentType: "international",
    sessions: [
      { id: "s5-1", date: "1404/08/25", time: "14:00", type: "مشورت شغلی", notes: "بررسی فرصت‌های شغلی", referrals: [] },
      { id: "s5-2", date: "1404/10/10", time: "15:00", type: "مشورت شغلی، بررسی آموزشی", notes: "آماده‌سازی رزومه", referrals: [{ id: "ref5", target: "مسئول آموزش", reason: "نیاز به کارآموزی", date: "1404/10/10", status: "completed", confirmedDate: "1404/10/15" }] },
    ],
  },
  {
    id: "student6",
    firstName: "سارا",
    lastName: "رحیمی",
    studentNumber: "9912350",
    username: "student6",
    password: "123456",
    gpa: 13.0,
    phoneNumber: "09171234567",
    advisorId: "advisor1",
    advisorName: "دکتر محمد رضایی",
    semester: "1404-1",
    totalSessions: 1,
    role: "student",
    studentType: "quota",
    sessions: [
      { id: "s6-1", date: "1404/09/25", time: "10:00", type: "بررسی افت تحصیلی، مشورت امور مالی", notes: "بررسی وضعیت", referrals: [{ id: "ref6", target: "مسئول اساتید مشاور", reason: "افت معدل شدید", date: "1404/09/25", status: "in_progress" }] },
    ],
  },
];

export const initialAppointments: Appointment[] = [
  {
    id: "apt1",
    studentId: "student1",
    advisorId: "advisor1",
    date: "1404/11/01",
    time: "10:00-11:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "pending",
    description: "درخواست مشاوره تحصیلی برای انتخاب واحد",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "apt2",
    studentId: "student2",
    advisorId: "advisor1",
    date: "1404/11/02",
    time: "09:00-10:00",
    appointmentType: { label: "فردی - مجازی", value: "individual_virtual" },
    status: "approved",
    description: "مشاوره در مورد پایان‌نامه",
    createdAt: "2026-01-19T08:30:00Z",
  },
  {
    id: "apt3",
    studentId: "student3",
    advisorId: "advisor2",
    date: "1404/11/03",
    time: "10:00-11:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "approved",
    description: "جلسه مشاوره",
    createdAt: "2026-01-18T14:00:00Z",
  },
  {
    id: "apt4",
    studentId: "student4",
    advisorId: "advisor2",
    date: "1404/11/05",
    time: "13:00-14:00",
    appointmentType: { label: "گروهی - حضوری", value: "group_in_person" },
    status: "pending",
    description: "جلسه مشاوره گروهی",
    createdAt: "2026-01-21T09:00:00Z",
  },
  {
    id: "apt5",
    studentId: "student5",
    advisorId: "advisor3",
    date: "1404/11/04",
    time: "14:00-15:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "rejected",
    description: "مشاوره شغلی",
    rejectionReason: "زمان درخواستی با برنامه هفتگی تداخل دارد. لطفاً زمان دیگری انتخاب کنید.",
    createdAt: "2026-01-17T11:00:00Z",
  },
  {
    id: "apt6",
    studentId: "student1",
    advisorId: "advisor1",
    date: "1404/10/25",
    time: "11:00-12:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "approved",
    description: "بررسی نمرات",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "apt7",
    studentId: "student2",
    advisorId: "advisor1",
    date: "1404/10/20",
    time: "10:00-11:00",
    appointmentType: { label: "فردی - مجازی", value: "individual_virtual" },
    status: "approved",
    description: "پیگیری وضعیت تحصیلی",
    createdAt: "2026-01-14T09:00:00Z",
  },
  {
    id: "apt8",
    studentId: "student3",
    advisorId: "advisor2",
    date: "1404/10/18",
    time: "09:00-10:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "rejected",
    description: "جلسه مشاوره",
    rejectionReason: "به دلیل تعطیلی دانشگاه امکان برگزاری نیست.",
    createdAt: "2026-01-12T15:00:00Z",
  },
  {
    id: "apt9",
    studentId: "student5",
    advisorId: "advisor3",
    date: "1404/11/06",
    time: "15:00-16:00",
    appointmentType: { label: "گروهی - مجازی", value: "group_virtual" },
    status: "pending",
    description: "کارگاه رزومه‌نویسی",
    createdAt: "2026-01-22T08:00:00Z",
  },
  {
    id: "apt10",
    studentId: "student4",
    advisorId: "advisor2",
    date: "1404/10/22",
    time: "11:00-12:00",
    appointmentType: { label: "فردی - حضوری", value: "individual_in_person" },
    status: "approved",
    description: "مشاوره تحصیلی",
    createdAt: "2026-01-13T10:00:00Z",
  },
];

export const initialMessages: Message[] = [
  {
    id: "msg1",
    senderId: "student1",
    senderName: "علی احمدی",
    senderRole: "student",
    receiverId: "advisor1",
    receiverName: "دکتر محمد رضایی",
    receiverRole: "advisor",
    subject: "سوال درباره انتخاب واحد",
    body: "سلام استاد، آیا امکان اخذ درس فیزیولوژی ۲ در ترم آینده وجود دارد؟",
    isRead: true,
    createdAt: "2026-01-18T10:30:00Z",
    replies: [
      {
        id: "reply1",
        senderId: "advisor1",
        senderName: "دکتر محمد رضایی",
        senderRole: "advisor",
        body: "سلام، بله مشکلی نیست. در جلسه بعدی بررسی می‌کنیم.",
        createdAt: "2026-01-18T14:00:00Z",
      }
    ],
  },
  {
    id: "msg2",
    senderId: "student3",
    senderName: "رضا حسینی",
    senderRole: "student",
    receiverId: "dept_education",
    receiverName: "بخش آموزش",
    receiverRole: "department",
    department: "آموزش",
    subject: "درخواست گواهی اشتغال به تحصیل",
    body: "با سلام، لطفاً گواهی اشتغال به تحصیل صادر فرمایید.",
    isRead: false,
    createdAt: "2026-01-20T09:15:00Z",
    replies: [],
  },
  {
    id: "msg5",
    senderId: "advisor1",
    senderName: "دکتر محمد رضایی",
    senderRole: "advisor",
    receiverId: "student1",
    receiverName: "علی احمدی",
    receiverRole: "student",
    subject: "یادآوری جلسه مشاوره",
    body: "دانشجوی عزیز، جلسه مشاوره شما فردا ساعت ۱۰ تنظیم شده است.",
    isRead: false,
    createdAt: "2026-01-22T07:00:00Z",
    replies: [],
  },
];

export const appointmentTypes: AppointmentType[] = [
  { label: "فردی - حضوری", value: "individual_in_person" },
  { label: "فردی - مجازی", value: "individual_virtual" },
  { label: "گروهی - حضوری", value: "group_in_person" },
  { label: "گروهی - مجازی", value: "group_virtual" },
];
