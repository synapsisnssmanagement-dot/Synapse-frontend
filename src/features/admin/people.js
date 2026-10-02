"use client";

import { useCallback, useMemo } from "react";
import { Award, BadgeCheck, ClipboardCheck, Compass, GraduationCap, HeartHandshake, Presentation, UserCheck } from "lucide-react";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";

// Every approval and directory endpoint for the four account types, verified
// against the backend routes. Approve sets status "active"; every reject sets
// status "rejected" without deleting, so a rejection can be reversed later.
export const PEOPLE = {
  student: {
    key: "student",
    singular: "student",
    plural: "students",
    title: "Students",
    icon: GraduationCap,
    queueIcon: UserCheck,
    pendingHref: "/adminpanel/pending?role=student",
    directoryHref: "/adminpanel/allstudent",
    pending: {
      list: "/api/students/getallpendingstudent",
      field: "students",
      approve: (id) => `/api/students/approvependingstudent/${id}`,
      reject: (id) => `/api/students/rejectstuedent/${id}`,
    },
    directory: {
      list: "/api/students/getallstudent",
      field: "students",
      approve: (id) => `/api/students/approvependingstudent/${id}`,
      reject: (id) => `/api/students/rejectinallstudent/${id}`,
    },
    hasDocument: false,
  },
  teacher: {
    key: "teacher",
    singular: "teacher",
    plural: "teachers",
    title: "Teachers",
    icon: Presentation,
    queueIcon: BadgeCheck,
    pendingHref: "/adminpanel/pending?role=teacher",
    directoryHref: "/adminpanel/allteachers",
    pending: {
      list: "/api/teacher/pendingteacher",
      field: "teachers",
      approve: (id) => `/api/teacher/approvependingteacher/${id}`,
      reject: (id) => `/api/teacher/rejectpendingteacher/${id}`,
    },
    directory: {
      list: "/api/teacher/getallteacher",
      field: "teachers",
      approve: (id) => `/api/teacher/approvependingteacher/${id}`,
      reject: (id) => `/api/teacher/rejectteacherindashboard/${id}`,
    },
    hasDocument: true,
  },
  coordinator: {
    key: "coordinator",
    singular: "coordinator",
    plural: "coordinators",
    title: "Coordinators",
    icon: Compass,
    queueIcon: ClipboardCheck,
    pendingHref: "/adminpanel/pending?role=coordinator",
    directoryHref: "/adminpanel/allcoordinators",
    pending: {
      list: "/api/coordinator/getallpendingcoordinator",
      field: "coordinator",
      approve: (id) => `/api/coordinator/approvecoordinator/${id}`,
      reject: (id) => `/api/coordinator/rejectcoordinator/${id}`,
    },
    directory: {
      list: "/api/coordinator/getallcoordinator",
      field: "coordinator",
      approve: (id) => `/api/coordinator/approvecoordinator/${id}`,
      reject: (id) => `/api/coordinator/rejectcoordinatorindahboard/${id}`,
    },
    hasDocument: true,
  },
  alumni: {
    key: "alumni",
    singular: "alumni member",
    plural: "alumni",
    title: "Alumni",
    icon: HeartHandshake,
    queueIcon: Award,
    pendingHref: "/adminpanel/pending?role=alumni",
    directoryHref: "/adminpanel/allalumni",
    pending: {
      list: "/api/alumni/pending",
      field: "alumni",
      approve: (id) => `/api/alumni/approve/${id}`,
      reject: (id) => `/api/alumni/reject/${id}`,
    },
    directory: {
      list: "/api/alumni/",
      field: "alumnis",
      approve: (id) => `/api/alumni/approve/${id}`,
      reject: (id) => `/api/alumni/reject-dashboard/${id}`,
    },
    hasDocument: false,
  },
};

export const PEOPLE_ORDER = ["student", "teacher", "coordinator", "alumni"];

export function useDashboardStats() {
  return useResource(() => api.get("/api/admin/dashboardata").then((res) => res.data?.Data || {}), []);
}

// List endpoints return the institution as a bare id; resolve names client-side.
export function useInstitutionName() {
  const resource = useResource(() => api.get("/api/institution/allinstitutebyadmin").then((res) => res.data?.institutions || []), []);
  const byId = useMemo(() => new Map((resource.data || []).map((inst) => [String(inst._id), inst.name])), [resource.data]);
  return useCallback(
    (institution) => {
      if (!institution) return "—";
      if (typeof institution === "object" && institution.name) return institution.name;
      return byId.get(String(institution?._id || institution)) || "—";
    },
    [byId]
  );
}

export function documentUrl(person) {
  return person?.verificationDocument?.url || null;
}

export function isPdf(url) {
  return /\.pdf($|\?)/i.test(url || "") || /\/raw\/upload\//.test(url || "");
}
