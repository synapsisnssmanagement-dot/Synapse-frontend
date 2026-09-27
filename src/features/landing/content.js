export const SIGNUP_ROLES = [
  { role: "Student", href: "/signup/student", blurb: "Track hours, events and certificates" },
  { role: "Teacher", href: "/signup/teacher", blurb: "Mark attendance and approve grace marks" },
  { role: "Coordinator", href: "/signup/coordinator", blurb: "Run your institution's NSS unit" },
  { role: "Alumni", href: "/signup/alumni", blurb: "Mentor, give back and stay connected" },
];

export function siteLinks({ onHome = true, hasTestimonials = false } = {}) {
  const base = onHome ? "" : "/";
  return [
    { label: "Why Synapsis", href: `${base}#why` },
    { label: "How it works", href: `${base}#how` },
    { label: "Capabilities", href: `${base}#features` },
    { label: "Events", href: `${base}#events` },
    { label: "Album", href: "/eventalbum" },
    ...(hasTestimonials ? [{ label: "Voices", href: `${base}#voices` }] : []),
  ];
}
