import { CalendarDays, Clock3, HeartHandshake, MapPin, Send, Sparkles, Users } from "lucide-react";
import Avatar, { AvatarGroup } from "@/components/ui/Avatar";
import { LevelBadge, StatusBadge } from "@/components/ui/Badge";
import cx from "@/lib/cx";

// Illustrative product previews for the landing page. They are static
// compositions of real Synapsis UI, not live data.

function Frame({ path, children, className }) {
  return (
    <div className={cx("overflow-hidden rounded-xl border border-line bg-paper text-left shadow-elevated", className)}>
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2 truncate text-[11px] font-medium text-muted">{path}</span>
      </div>
      {children}
    </div>
  );
}

export function RosterPreview() {
  const rows = [
    ["Aditi Menon", "BSW, 3rd year", 54, "Platinum"],
    ["Rahul Nair", "B.Com, 2nd year", 31, "Gold"],
    ["Fathima Rasheed", "BSc Physics, 2nd year", 18, "Silver"],
    ["Arjun Krishnan", "BA English, 1st year", 6, "Bronze"],
  ];
  return (
    <Frame path="Coordinator / Volunteers">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <p className="text-[13px] font-semibold text-fg">Unit 42 · Social Work</p>
        <span className="text-[11px] font-medium text-muted">4 of 86 volunteers</span>
      </div>
      <ul className="divide-y divide-line px-5 pb-2">
        {rows.map(([name, course, hours, level]) => (
          <li key={name} className="flex items-center gap-3 py-3">
            <Avatar name={name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-fg">{name}</p>
              <p className="truncate text-[11.5px] text-muted">{course}</p>
            </div>
            <span className="tabular hidden text-[12px] font-semibold text-fg-2 sm:block">{hours} h</span>
            <LevelBadge level={level} size="sm" />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function EventPreview() {
  const people = ["Sneha Pillai", "Mohammed Ashik", "Devika S", "Nikhil Varma", "Anjali Thomas"].map((name) => ({ name }));
  return (
    <Frame path="Events / Coastal Cleanup Initiative">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-fg">Coastal Cleanup Initiative</p>
          <StatusBadge status="ongoing" size="sm" />
        </div>
        <ul className="mt-3 space-y-1.5 text-[12.5px] text-fg-2">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-3.5 text-subtle" /> Saturday, 14 December · 7:00 AM
          </li>
          <li className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-3.5 text-subtle" /> Shanghumugham Beach, Thiruvananthapuram
          </li>
          <li className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-3.5 text-subtle" /> 4 hours
          </li>
        </ul>
        <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-lg border border-line">
          {[
            ["42", "Volunteers"],
            ["2", "Teachers"],
            ["On", "Donations"],
          ].map(([value, label]) => (
            <div key={label} className="px-3 py-2.5">
              <p className="tabular text-[15px] font-semibold text-fg">{value}</p>
              <p className="text-[11px] text-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <AvatarGroup people={[...people, ...people, ...people]} max={4} size="sm" />
          <span className="rounded-md bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white">Open event room</span>
        </div>
      </div>
    </Frame>
  );
}

export function AttendancePreview() {
  const rows = [
    ["Aditi Menon", true],
    ["Rahul Nair", true],
    ["Fathima Rasheed", false],
    ["Arjun Krishnan", true],
  ];
  return (
    <Frame path="Teacher / Attendance">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[13px] font-semibold text-fg">Digital Literacy Workshop</p>
        <div className="mt-3 flex gap-5 text-[12px]">
          <span className="flex items-center gap-1.5 font-semibold text-brand-700">
            <span className="size-1.5 rounded-full bg-brand" /> 28 present
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-red-600">
            <span className="size-1.5 rounded-full bg-danger" /> 3 absent
          </span>
          <span className="text-muted">31 total</span>
        </div>
      </div>
      <ul className="divide-y divide-line px-5">
        {rows.map(([name, present]) => (
          <li key={name} className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-fg">
              <Avatar name={name} size="xs" />
              {name}
            </span>
            <span className="flex rounded-md border border-line p-0.5 text-[11px] font-semibold">
              <span className={cx("rounded-[5px] px-2.5 py-1", present ? "bg-brand text-ink" : "text-muted")}>Present</span>
              <span className={cx("rounded-[5px] px-2.5 py-1", !present ? "bg-red-600 text-white" : "text-muted")}>Absent</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-end border-t border-line bg-canvas px-5 py-3">
        <span className="rounded-md bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white">Save attendance</span>
      </div>
    </Frame>
  );
}

export function InsightPreview() {
  const months = [
    ["Jul", 38],
    ["Aug", 52],
    ["Sep", 44],
    ["Oct", 71],
    ["Nov", 63],
    ["Dec", 88],
  ];
  const max = 88;
  return (
    <Frame path="Coordinator / Insights">
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-fg">Volunteer hours by month</p>
          <p className="tabular text-[12px] font-semibold text-brand-700">+39%</p>
        </div>
        <div className="mt-5 flex h-32 items-end gap-2.5">
          {months.map(([month, value], i) => (
            <div key={month} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div
                className={cx("rounded-t-[3px]", i === months.length - 1 ? "bg-brand" : "bg-ink/10")}
                style={{ height: `${(value / max) * 100}%` }}
              />
              <span className="text-center text-[10.5px] text-muted">{month}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3 rounded-lg bg-ink p-4 text-[12.5px] leading-relaxed text-on-dark/80">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
          <p>
            Participation rose after the blood donation camp. First-years are under-represented — a weekend drive could help.
          </p>
        </div>
      </div>
    </Frame>
  );
}

export function ChatPreview() {
  return (
    <Frame path="Mentorship / Rahul Nair">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <Avatar name="Rahul Nair" size="sm" />
        <div>
          <p className="text-[13px] font-semibold text-fg">Rahul Nair</p>
          <p className="text-[11px] text-muted">Alumni · B.Com, 2019 · Online</p>
        </div>
      </div>
      <div className="space-y-3 bg-canvas px-5 py-5">
        <p className="w-fit max-w-[80%] rounded-xl rounded-bl-sm border border-line bg-paper px-3.5 py-2.5 text-[12.5px] text-fg">
          Could we talk about preparing for my first internship interview?
        </p>
        <p className="ml-auto w-fit max-w-[80%] rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-[12.5px] text-white">
          Of course. Thursday at 6 pm works — I will share the meeting link here.
        </p>
        <p className="w-fit max-w-[80%] rounded-xl rounded-bl-sm border border-line bg-paper px-3.5 py-2.5 text-[12.5px] text-fg">
          Perfect, thank you.
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <span className="flex-1 rounded-md border border-line px-3 py-2 text-[12px] text-subtle">Write a message</span>
        <span className="flex size-8 items-center justify-center rounded-md bg-brand text-ink">
          <Send aria-hidden="true" className="size-3.5" />
        </span>
      </div>
    </Frame>
  );
}

export function DonationPreview() {
  return (
    <Frame path="Alumni / Donations">
      <div className="p-5">
        <p className="eyebrow text-[0.62rem] text-muted">Supporting</p>
        <p className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-fg">Flood Relief Collection Drive</p>
        <p className="mt-1 text-[12.5px] text-muted">Relief kits for 120 families in Kuttanad</p>
        <div className="mt-5 flex items-baseline justify-between">
          <p className="tabular text-[22px] font-semibold tracking-[-0.03em] text-fg">₹38,500</p>
          <p className="tabular text-[12px] text-muted">of ₹60,000</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
          <div className="h-full w-[64%] rounded-full bg-brand" />
        </div>
        <div className="mt-4 flex items-center justify-between text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5" /> 27 alumni contributed
          </span>
          <span className="tabular font-semibold text-brand-700">64%</span>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-[13px] font-semibold text-ink">
          <HeartHandshake aria-hidden="true" className="size-4" /> Donate securely
        </div>
      </div>
    </Frame>
  );
}
