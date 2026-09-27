import Scene from "./Scene";
import { SectionLabel } from "./parts";

const STEPS = [
  {
    title: "Plan",
    text: "A coordinator creates the drive — date, place, hours, the teachers in charge and whether it accepts donations.",
  },
  {
    title: "Serve",
    text: "Volunteers are assigned and notified. An event room opens so the whole team can coordinate in real time.",
  },
  {
    title: "Record",
    text: "Teachers mark attendance on the day. Hours come from when the event actually started and ended.",
  },
  {
    title: "Recognise",
    text: "Hours roll up into levels, grace marks are reviewed, and certificates are ready to download.",
  },
];

export default function HowItWorks() {
  return (
    <Scene id="how" aria-labelledby="how-title" className="relative overflow-hidden bg-brand text-ink">
      <div className="container-editorial py-24 sm:py-32 lg:py-40">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-6">
            <SectionLabel index="04" tone="brand">
              How it works
            </SectionLabel>
            <h2 id="how-title" data-split="lines" className="mt-8 font-semibold text-display-lg">
              From plan to <em className="font-display font-normal italic">proof,</em> in four steps.
            </h2>
          </div>
          <p data-reveal className="max-w-md text-[17px] leading-relaxed text-ink/75 lg:col-span-4 lg:col-start-9 lg:self-end">
            Every drive follows the same path, so nothing depends on who remembers to update the register.
          </p>
        </div>

        <div data-draw-trigger className="relative mt-20 pl-10 lg:mt-28 lg:pl-0">
          <span aria-hidden="true" className="absolute bottom-2 left-[11px] top-2 w-px bg-ink/15 lg:inset-x-0 lg:bottom-auto lg:left-0 lg:top-[11px] lg:h-px lg:w-auto" />
          <span aria-hidden="true" data-draw="y" className="absolute bottom-2 left-[11px] top-2 w-px origin-top bg-ink lg:hidden" />
          <span aria-hidden="true" data-draw className="absolute inset-x-0 top-[11px] hidden h-px origin-left bg-ink lg:block" />
          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} data-reveal className="relative lg:pr-6">
              <span
                aria-hidden="true"
                className="absolute -left-10 top-0 flex size-[23px] items-center justify-center rounded-full border-2 border-ink bg-brand lg:static lg:mb-8"
              >
                <span className="size-2 rounded-full bg-ink" />
              </span>
              <p className="eyebrow tabular text-ink/60">Step {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em]">{step.title}</h3>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink/75">{step.text}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </Scene>
  );
}
