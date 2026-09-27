import Scene from "./Scene";
import { SectionLabel } from "./parts";

const AUDIENCES = [
  {
    who: "For volunteers",
    text: "See every event you joined, every hour you served and every level you earned — and download the certificate when it's done.",
  },
  {
    who: "For teachers and coordinators",
    text: "Plan drives, assign teams, mark attendance and review grace marks without chasing registers or spreadsheets.",
  },
  {
    who: "For alumni",
    text: "Stay close to the unit that shaped you. Mentor a student, share a memory, or support a drive you believe in.",
  },
];

// True of the product itself, so they hold even before any data exists.
const FACTS = [
  { value: 5, label: "Roles, one record", text: "Admins, coordinators, teachers, volunteers and alumni work from the same system." },
  { value: 4, label: "Volunteer levels", text: "Bronze, Silver, Gold and Platinum — earned hour by hour." },
  { value: 50, label: "Hours to Platinum", text: "The highest level recognises service that is sustained, not occasional." },
  { value: 2, label: "Live chat spaces", text: "Event rooms for the whole team, private rooms for mentorship." },
];

export default function Manifesto({ stats }) {
  const live = stats?.eventsCompleted > 0;
  return (
    <Scene id="why" aria-labelledby="why-title" className="relative bg-ink text-on-dark">
      <div className="container-editorial py-24 sm:py-32 lg:py-44">
        <SectionLabel index="02" tone="dark">
          Why Synapsis
        </SectionLabel>
        <h2 id="why-title" className="sr-only">
          Why Synapsis
        </h2>
        <p
          data-split="scrub"
          className="mt-10 max-w-[30ch] font-medium text-white text-display-md sm:mt-14 lg:max-w-[34ch]"
        >
          NSS runs on people giving their time. For years that time lived in registers, spreadsheets and group chats — hard
          to count, easy to lose. Synapsis gives{" "}
          <em className="font-display font-normal italic text-brand">every hour of service</em> a place to be recorded, a path
          to grow, and a community to grow with.
        </p>

        <ul className="mt-20 grid gap-10 border-t border-white/10 pt-10 sm:mt-28 md:grid-cols-3 md:gap-8">
          {AUDIENCES.map((item) => (
            <li key={item.who} data-reveal className="max-w-sm">
              <p className="eyebrow text-brand">{item.who}</p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-on-dark/70">{item.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-28 sm:mt-40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionLabel index="03" tone="dark">
              Built around the work
            </SectionLabel>
            <p data-reveal className="max-w-sm text-sm leading-relaxed text-on-dark/55">
              The structure behind every unit on Synapsis, from the first hour a volunteer logs to the last.
            </p>
          </div>
          <dl className="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div
                key={fact.label}
                data-reveal
                className="border-b border-white/10 py-8 sm:px-6 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
              >
                <dt className="eyebrow text-on-dark/55">{fact.label}</dt>
                <dd className="mt-6">
                  <span
                    data-count={fact.value}
                    data-count-pad="2"
                    className="tabular block font-display leading-[0.85] text-brand text-display-xl"
                  >
                    {String(fact.value).padStart(2, "0")}
                  </span>
                  <span className="mt-6 block max-w-[30ch] text-[14.5px] leading-relaxed text-on-dark/65">{fact.text}</span>
                </dd>
              </div>
            ))}
          </dl>

          {live ? (
            <div data-reveal className="mt-12 flex flex-col gap-6 rounded-sm border border-white/10 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
              <p className="eyebrow flex items-center gap-2 text-brand">
                <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-full bg-brand" />
                Recorded on Synapsis
              </p>
              <ul className="flex flex-wrap gap-x-10 gap-y-4">
                {[
                  [stats.eventsCompleted, "events completed"],
                  [stats.volunteerHours, "volunteer hours"],
                  [stats.volunteers, "volunteers"],
                ].map(([value, label]) => (
                  <li key={label} className="flex items-baseline gap-2">
                    <span data-count={value} className="tabular text-2xl font-semibold text-white">
                      {value.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-on-dark/60">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Scene>
  );
}
