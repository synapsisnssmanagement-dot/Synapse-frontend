import {
  Award,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  ClipboardCheck,
  Compass,
  FileBarChart,
  FileText,
  GraduationCap,
  HandHelping,
  HandCoins,
  HeartHandshake,
  ImagePlus,
  Images,
  LayoutGrid,
  Medal,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  PenSquare,
  Presentation,
  Quote,
  ScrollText,
  Sparkles,
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
      { label: "Overview", items: [{ label: "Dashboard", href: "/adminpanel", icon: LayoutGrid, exact: true }] },
      {
        label: "Approvals",
        items: [{ label: "Pending approvals", href: "/adminpanel/pending", icon: UserCheck }],
      },
      {
        label: "Directory",
        items: [
          { label: "Students", href: "/adminpanel/allstudent", icon: GraduationCap },
          { label: "Teachers", href: "/adminpanel/allteachers", icon: Presentation },
          { label: "Coordinators", href: "/adminpanel/allcoordinators", icon: Compass },
          { label: "Alumni", href: "/adminpanel/allalumni", icon: HeartHandshake },
        ],
      },
      {
        label: "Institutions",
        items: [
          { label: "Institutions", href: "/adminpanel/manageinstitute", icon: Building2 },
          { label: "Add institution", href: "/adminpanel/createinstitution", icon: PenSquare },
        ],
      },
      { label: "Community", items: [{ label: "Testimonials", href: "/adminpanel/testimonials", icon: Quote }] },
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
      { label: "Overview", items: [{ label: "Dashboard", href: "/coordinatorlayout", icon: LayoutGrid, exact: true }] },
      {
        label: "Events",
        items: [
          { label: "Create event", href: "/coordinatorlayout/createevent", icon: CalendarPlus },
          { label: "My events", href: "/coordinatorlayout/myevents", icon: CalendarRange },
          { label: "Event reports", href: "/coordinatorlayout/eventreport", icon: FileBarChart },
        ],
      },
      {
        label: "People",
        items: [
          { label: "Students", href: "/coordinatorlayout/managestudents", icon: GraduationCap },
          { label: "Volunteers", href: "/coordinatorlayout/managevolunteer", icon: Users },
          { label: "Teachers", href: "/coordinatorlayout/manageteacher", icon: Presentation },
        ],
      },
      {
        label: "Recognition",
        items: [
          { label: "NSS certificates", href: "/coordinatorlayout/eligibility", icon: Medal },
          { label: "Grace marks", href: "/coordinatorlayout/recommendgracemark", icon: Award },
          { label: "Donations", href: "/coordinatorlayout/ManageDonation", icon: HandCoins },
        ],
      },
      {
        label: "Community",
        items: [
          { label: "Help requests", href: "/coordinatorlayout/requests", icon: HandHelping },
          { label: "Event chat", href: "/coordinatorlayout/chat", icon: MessagesSquare },
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
      { label: "Overview", items: [{ label: "Dashboard", href: "/teacherLayout", icon: LayoutGrid, exact: true }] },
      {
        label: "Events",
        items: [
          { label: "My events", href: "/teacherLayout/myeventsteacher", icon: CalendarRange },
          { label: "Attendance", href: "/teacherLayout/attendanceByTeacher", icon: CalendarCheck },
          { label: "Attendance reports", href: "/teacherLayout/attendancepdf", icon: FileText },
        ],
      },
      {
        label: "Grace marks",
        items: [
          { label: "Review requests", href: "/teacherLayout/approvegracebyteacher", icon: ClipboardCheck },
          { label: "Assign grace marks", href: "/teacherLayout/assigngracemarks", icon: Award },
        ],
      },
      {
        label: "Community",
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
      { label: "Overview", items: [{ label: "Dashboard", href: "/studentlayout/dashboard", icon: LayoutGrid }] },
      {
        label: "Service",
        items: [
          { label: "My events", href: "/studentlayout/studentevents", icon: CalendarRange },
          { label: "Attendance", href: "/studentlayout/studentattendance", icon: CalendarCheck },
          { label: "Certificates", href: "/studentlayout/certificates", icon: ScrollText },
          { label: "Add a memory", href: "/studentlayout/studentupload", icon: ImagePlus },
        ],
      },
      {
        label: "Mentorship",
        items: [
          { label: "Find a mentor", href: "/studentlayout/mentorshiprequestbyvolunteer", icon: UserRoundSearch },
          { label: "My mentors", href: "/studentlayout/mymentors", icon: Sparkles },
          { label: "Mentorship chat", href: "/studentlayout/mentorshipchatlayout", icon: MessageCircle },
        ],
      },
      {
        label: "Community",
        items: [
          { label: "Announcements", href: "/studentlayout/announcement", icon: Megaphone },
          { label: "Event chat", href: "/studentlayout/chatstudent", icon: MessagesSquare },
          { label: "Leaderboard", href: "/studentlayout/leaderboard", icon: Trophy },
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
      { label: "Overview", items: [{ label: "Dashboard", href: "/alumnilayout/dashboard", icon: LayoutGrid }] },
      {
        label: "Mentorship",
        items: [
          { label: "Mentees", href: "/alumnilayout/managementorship", icon: Users },
          { label: "Mentorship chat", href: "/alumnilayout/mentorshipchatlayout", icon: MessageCircle },
        ],
      },
      { label: "Giving", items: [{ label: "Donations", href: "/alumnilayout/donations", icon: HandCoins }] },
      {
        label: "Community",
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
  if (pathname.startsWith(config.profile)) return { group: { label: "Account" }, item: { label: "Profile" } };
  return null;
}
