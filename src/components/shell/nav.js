import {
  Award,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  BookOpen,
  FileCog,
  MessageSquareWarning,
  Compass,
  FileBarChart,
  FileText,
  FolderKanban,
  GraduationCap,
  HandHelping,
  HandCoins,
  HeartHandshake,
  ImagePlus,
  Images,
  Landmark,
  LayoutGrid,
  MapPin,
  Medal,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  PenSquare,
  Presentation,
  Quote,
  ScrollText,
  Sparkles,
  Tent,
  Trophy,
  UserCheck,
  UserCircle2,
  UserRoundSearch,
  Users,
} from "lucide-react";

/*
  One configuration per role drives the sidebar, mobile navigation, breadcrumbs
  and the jump-to palette. `exact` marks dashboard roots that must not match
  their children. `fullBleed` routes (chat) take the whole content area.
*/
export const ROLE_NAV = {
  admin: {
    label: "Admin",
    roles: ["admin", "superadmin"],
    home: "/adminpanel",
    profile: "/adminpanel/adminprofile",
    notifications: true,
    groups: [
      { label: "Home", icon: LayoutGrid, items: [{ label: "Dashboard", href: "/adminpanel", icon: LayoutGrid, exact: true }] },
      { label: "Approvals", icon: UserCheck, items: [{ label: "Pending approvals", href: "/adminpanel/pending", icon: UserCheck }] },
      {
        label: "People",
        icon: Users,
        items: [
          { label: "Students", href: "/adminpanel/allstudent", icon: GraduationCap },
          { label: "Teachers", href: "/adminpanel/allteachers", icon: Presentation },
          { label: "Coordinators", href: "/adminpanel/allcoordinators", icon: Compass },
          { label: "Alumni", href: "/adminpanel/allalumni", icon: HeartHandshake },
        ],
      },
      {
        label: "Institutions",
        icon: Building2,
        items: [
          { label: "All institutions", href: "/adminpanel/manageinstitute", icon: Building2 },
          { label: "Add institution", href: "/adminpanel/createinstitution", icon: PenSquare },
        ],
      },
      { label: "Testimonials", icon: Quote, items: [{ label: "Testimonials", href: "/adminpanel/testimonials", icon: Quote }] },
    ],
  },
  coordinator: {
    label: "Coordinator",
    roles: ["coordinator"],
    home: "/coordinatorlayout",
    profile: "/coordinatorlayout/coordinatormyprofile",
    notifications: true,
    fullBleed: ["/coordinatorlayout/chat"],
    groups: [
      {
        label: "Home",
        icon: LayoutGrid,
        items: [
          { label: "Dashboard", href: "/coordinatorlayout", icon: LayoutGrid, exact: true },
          { label: "Today", href: "/coordinatorlayout/workspace", icon: ClipboardList },
        ],
      },
      {
        label: "Events",
        icon: CalendarRange,
        items: [
          { label: "My events", href: "/coordinatorlayout/myevents", icon: CalendarRange },
          { label: "Create event", href: "/coordinatorlayout/createevent", icon: CalendarPlus },
          { label: "Projects", href: "/coordinatorlayout/projects", icon: FolderKanban },
          { label: "Camps", href: "/coordinatorlayout/camps", icon: Tent },
          { label: "Event reports", href: "/coordinatorlayout/eventreport", icon: FileBarChart },
        ],
      },
      {
        label: "Attendance & hours",
        short: "Attendance",
        icon: CalendarCheck,
        items: [
          { label: "Field attendance", href: "/coordinatorlayout/fieldattendance", icon: UserCheck },
          { label: "Review attendance", href: "/coordinatorlayout/attendancereview", icon: CalendarCheck },
          { label: "Diaries", href: "/coordinatorlayout/diaryreview", icon: ClipboardCheck },
          { label: "Hours complaints", href: "/coordinatorlayout/complaints", icon: MessageSquareWarning },
        ],
      },
      {
        label: "People",
        icon: Users,
        items: [
          { label: "Students", href: "/coordinatorlayout/managestudents", icon: GraduationCap },
          { label: "Volunteers", href: "/coordinatorlayout/managevolunteer", icon: Users },
          { label: "Teachers", href: "/coordinatorlayout/manageteacher", icon: Presentation },
        ],
      },
      {
        label: "Certificates",
        icon: Medal,
        items: [
          { label: "NSS certificates", href: "/coordinatorlayout/eligibility", icon: Medal },
          { label: "Completion", href: "/coordinatorlayout/completion", icon: ScrollText },
          { label: "Grace marks", href: "/coordinatorlayout/recommendgracemark", icon: Award },
        ],
      },
      {
        label: "Money & registers",
        short: "Money",
        icon: Landmark,
        items: [
          { label: "Finance", href: "/coordinatorlayout/finance", icon: Landmark },
          { label: "Donations", href: "/coordinatorlayout/ManageDonation", icon: HandCoins },
          { label: "Registers & reports", href: "/coordinatorlayout/reports", icon: FileText },
        ],
      },
      {
        label: "Community",
        icon: MessagesSquare,
        items: [
          { label: "Event chat", href: "/coordinatorlayout/chat", icon: MessagesSquare },
          { label: "Help requests", href: "/coordinatorlayout/requests", icon: HandHelping },
        ],
      },
      {
        label: "Settings",
        icon: FileCog,
        items: [
          { label: "Institution", href: "/coordinatorlayout/settings", icon: Building2 },
          { label: "Policies & units", href: "/coordinatorlayout/policies", icon: FileCog },
        ],
      },
    ],
  },
  teacher: {
    label: "Teacher",
    roles: ["teacher"],
    home: "/teacherLayout",
    profile: "/teacherLayout/teacherprofile",
    notifications: true,
    announcements: "/teacherLayout/announcement",
    fullBleed: ["/teacherLayout/teacherchat"],
    groups: [
      { label: "Home", icon: LayoutGrid, items: [{ label: "Dashboard", href: "/teacherLayout", icon: LayoutGrid, exact: true }] },
      {
        label: "Events",
        icon: CalendarRange,
        items: [
          { label: "My events", href: "/teacherLayout/myeventsteacher", icon: CalendarRange },
          { label: "Projects", href: "/teacherLayout/projects", icon: FolderKanban },
          { label: "Camps", href: "/teacherLayout/camps", icon: Tent },
        ],
      },
      {
        label: "Attendance",
        icon: CalendarCheck,
        items: [
          { label: "Mark attendance", href: "/teacherLayout/attendanceByTeacher", icon: CalendarCheck },
          { label: "Field attendance", href: "/teacherLayout/fieldattendance", icon: UserCheck },
          { label: "Review", href: "/teacherLayout/attendancereview", icon: ClipboardCheck },
          { label: "Diaries", href: "/teacherLayout/diaryreview", icon: ClipboardList },
          { label: "Reports", href: "/teacherLayout/attendancepdf", icon: FileText },
        ],
      },
      {
        label: "Grace marks",
        icon: Award,
        items: [
          { label: "Review requests", href: "/teacherLayout/approvegracebyteacher", icon: ClipboardCheck },
          { label: "Assign", href: "/teacherLayout/assigngracemarks", icon: Award },
        ],
      },
      {
        label: "Community",
        icon: Megaphone,
        items: [
          { label: "Announcements", href: "/teacherLayout/announcement", icon: Megaphone },
          { label: "Event chat", href: "/teacherLayout/teacherchat", icon: MessagesSquare },
        ],
      },
    ],
  },
  student: {
    label: "Volunteer",
    roles: ["student", "volunteer"],
    home: "/studentlayout/dashboard",
    profile: "/studentlayout/studentprofile",
    notifications: true,
    announcements: "/studentlayout/announcement",
    fullBleed: ["/studentlayout/chatstudent", "/studentlayout/mentorshipchatlayout"],
    groups: [
      { label: "Home", icon: LayoutGrid, items: [{ label: "Dashboard", href: "/studentlayout/dashboard", icon: LayoutGrid }] },
      {
        label: "Events",
        icon: CalendarRange,
        items: [
          { label: "My events", href: "/studentlayout/studentevents", icon: CalendarRange },
          { label: "Check in", href: "/studentlayout/checkin", icon: MapPin },
          { label: "Special camps", href: "/studentlayout/camps", icon: Tent },
        ],
      },
      {
        label: "My record",
        short: "Record",
        icon: BookOpen,
        items: [
          { label: "Diary & hours", href: "/studentlayout/passbook", icon: BookOpen },
          { label: "Attendance", href: "/studentlayout/studentattendance", icon: CalendarCheck },
          { label: "Certificates", href: "/studentlayout/certificates", icon: ScrollText },
        ],
      },
      {
        label: "Mentorship",
        icon: Sparkles,
        items: [
          { label: "My mentors", href: "/studentlayout/mymentors", icon: Sparkles },
          { label: "Find a mentor", href: "/studentlayout/mentorshiprequestbyvolunteer", icon: UserRoundSearch },
          { label: "Chat", href: "/studentlayout/mentorshipchatlayout", icon: MessageCircle },
        ],
      },
      {
        label: "Community",
        icon: Megaphone,
        items: [
          { label: "Announcements", href: "/studentlayout/announcement", icon: Megaphone },
          { label: "Event chat", href: "/studentlayout/chatstudent", icon: MessagesSquare },
          { label: "Leaderboard", href: "/studentlayout/leaderboard", icon: Trophy },
          { label: "Add a memory", href: "/studentlayout/studentupload", icon: ImagePlus },
        ],
      },
    ],
  },
  alumni: {
    label: "Alumni",
    roles: ["alumni"],
    home: "/alumnilayout/dashboard",
    profile: "/alumnilayout/alumniprofile",
    notifications: false,
    fullBleed: ["/alumnilayout/mentorshipchatlayout"],
    groups: [
      { label: "Home", icon: LayoutGrid, items: [{ label: "Dashboard", href: "/alumnilayout/dashboard", icon: LayoutGrid }] },
      {
        label: "Mentorship",
        icon: Users,
        items: [
          { label: "Mentees", href: "/alumnilayout/managementorship", icon: Users },
          { label: "Chat", href: "/alumnilayout/mentorshipchatlayout", icon: MessageCircle },
        ],
      },
      { label: "Donations", icon: HandCoins, items: [{ label: "Donations", href: "/alumnilayout/donations", icon: HandCoins }] },
      {
        label: "Community",
        icon: Quote,
        items: [
          { label: "Testimonials", href: "/alumnilayout/testimonials", icon: Quote },
          { label: "Feedback", href: "/alumnilayout/feedback", icon: PenSquare },
          { label: "Gallery", href: "/alumnilayout/gallery", icon: Images },
        ],
      },
    ],
  },
};

export const PROFILE_ICON = UserCircle2;

export function isActive(item, pathname) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findCurrent(config, pathname) {
  for (const group of config.groups) {
    for (const item of group.items) {
      if (isActive(item, pathname)) return { group, item };
    }
  }
  if (pathname.startsWith(config.profile)) return { group: { label: "Account", items: [] }, item: { label: "Profile" } };
  return null;
}

export function isGroupActive(group, pathname) {
  return group.items.some((item) => isActive(item, pathname));
}
