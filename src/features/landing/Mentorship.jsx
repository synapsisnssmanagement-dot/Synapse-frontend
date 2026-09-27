import Image from "next/image";
import { GraduationCap, HeartHandshake } from "lucide-react";
import Button from "@/components/ui/Button";
import Scene from "./Scene";
import { SectionLabel } from "./parts";

const SIDES = [
  {
    icon: GraduationCap,
    who: "Students",
    text: "Browse alumni mentors by department and interest, send a request, and keep the conversation going in a private chat.",
  },
  {
    icon: HeartHandshake,
    who: "Alumni",
    text: "Accept mentees, share memories and testimonials, or fund a drive you care about — without losing touch with the unit.",
  },
];

export default function Mentorship() {
  return (
    <Scene id="mentorship" aria-labelledby="mentorship-title" className="relative overflow-hidden bg-paper">
      <div className="container-editorial py-24 sm:py-32 lg:py-44">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <figure className="lg:col-span-6 lg:row-span-2" data-speed-trigger>
            <div data-clip data-cursor="Connect" className="relative aspect-[4/5] overflow-hidden bg-mist sm:aspect-[5/4] lg:aspect-[4/5]">
              <div data-speed="-14" className="absolute inset-[-8%_0]">
                <Image
                  src="/Images/IMG3.png"
                  alt="NSS volunteers sharing a conversation and a board game with elders at a care home"
                  fill
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[12.5px] text-muted">
              <span className="eyebrow shrink-0 text-[0.62rem] text-subtle">Fig. 02</span>
              <span>An afternoon at a care home, time given freely</span>
            </figcaption>
          </figure>

          <div className="lg:col-span-5 lg:col-start-8 lg:pt-10">
            <SectionLabel index="08">Mentorship and alumni</SectionLabel>
            <h2 id="mentorship-title" data-split="lines" className="mt-8 font-semibold text-ink text-display-lg">
              The people who served before you are <em className="font-display font-normal italic text-brand-700">one message away.</em>
            </h2>
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
            <ul className="border-t border-line">
              {SIDES.map(({ icon: Icon, who, text }) => (
                <li key={who} data-reveal className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-7">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-brand/25 bg-mint text-brand-700">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{who}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-8 flex flex-wrap gap-3">
              <Button href="/signup/alumni" variant="dark" arrow>
                Join as alumni
              </Button>
              <Button href="/signup/student" variant="outline">
                Find a mentor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
}
