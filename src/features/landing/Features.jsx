import FeatureShowcase from "./FeatureShowcase";
import { SectionLabel } from "./parts";
import { AttendancePreview, ChatPreview, DonationPreview, EventPreview, InsightPreview, RosterPreview } from "./previews";

const ITEMS = [
  {
    title: "Volunteer management",
    text: "Approvals, profiles and a complete participation history for every volunteer in your unit — with levels that update as hours are earned.",
    tags: ["Approvals", "Profiles", "Levels"],
    alt: "A volunteer roster showing names, courses, hours served and volunteer levels.",
    preview: <RosterPreview />,
  },
  {
    title: "Event operations",
    text: "Create a drive, assign teachers and volunteers, start it and complete it. Each event keeps its own room, gallery and report.",
    tags: ["Planning", "Assignments", "Event rooms"],
    alt: "An ongoing coastal cleanup event with its date, location, hours and team size.",
    preview: <EventPreview />,
  },
  {
    title: "Attendance and grace marks",
    text: "Mark a whole event in one pass with live counts. Coordinators recommend grace marks with a reason; teachers approve or reject them.",
    tags: ["One-pass attendance", "Review workflow"],
    alt: "An attendance sheet with present and absent toggles and live totals.",
    preview: <AttendancePreview />,
  },
  {
    title: "Insight",
    text: "Dashboards and AI-written summaries show where your unit is growing, and where it needs attention next.",
    tags: ["Dashboards", "AI summaries", "Reports"],
    alt: "A bar chart of volunteer hours by month with a written summary.",
    preview: <InsightPreview />,
  },
  {
    title: "Mentorship",
    text: "Students request mentors from your alumni network and continue the conversation in a private, real-time chat.",
    tags: ["Requests", "Private chat", "Meeting links"],
    alt: "A private mentorship conversation between a student and an alumni mentor.",
    preview: <ChatPreview />,
  },
  {
    title: "Donations",
    text: "Alumni can support a specific drive through secure Stripe payments, and everyone can see how close it is to its goal.",
    tags: ["Stripe", "Per-event goals"],
    alt: "A donation card for a flood relief drive showing progress toward its goal.",
    preview: <DonationPreview />,
  },
];

export default function Features() {
  return (
    <FeatureShowcase
      items={ITEMS}
      intro={
        <>
          <SectionLabel index="05">Capabilities</SectionLabel>
          <h2 id="features-title" data-split="lines" className="mt-8 font-semibold text-ink text-display-lg">
            Everything a unit <em className="font-display font-normal italic text-brand-700">runs on.</em>
          </h2>
          <p data-reveal className="mt-6 max-w-sm text-[16px] leading-relaxed text-fg-2">
            Six connected tools, one record. What happens in one place shows up everywhere it matters.
          </p>
        </>
      }
    />
  );
}
