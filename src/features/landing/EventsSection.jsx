"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3, HandCoins, MapPin, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Dialog";
import useChoreography from "@/lib/motion/useChoreography";
import { SectionLabel, SmartImage, formatEventDate } from "./parts";

function parts(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { day: "--", month: "TBA", weekday: "" };
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
    weekday: new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date),
  };
}

function Meta({ event, className = "" }) {
  return (
    <ul className={`space-y-2.5 text-[14.5px] text-fg-2 ${className}`}>
      <li className="flex items-center gap-3">
        <CalendarDays aria-hidden="true" className="size-4 text-subtle" />
        {formatEventDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </li>
      {event.location ? (
        <li className="flex items-center gap-3">
          <MapPin aria-hidden="true" className="size-4 text-subtle" />
          {event.location}
        </li>
      ) : null}
      <li className="flex items-center gap-3">
        <Clock3 aria-hidden="true" className="size-4 text-subtle" />
        {event.hours} {event.hours === 1 ? "hour" : "hours"} of service
      </li>
      <li className="flex items-center gap-3">
        <Users aria-hidden="true" className="size-4 text-subtle" />
        {event.participants} {event.participants === 1 ? "volunteer" : "volunteers"} assigned
      </li>
      {event.donationEnabled ? (
        <li className="flex items-center gap-3">
          <HandCoins aria-hidden="true" className="size-4 text-subtle" />
          Accepting alumni donations
        </li>
      ) : null}
    </ul>
  );
}

function DatePoster({ date }) {
  const { day, month, weekday } = parts(date);
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-ink p-6 text-white sm:p-10">
      <p className="eyebrow text-on-dark/50">{weekday || "Date to be announced"}</p>
      <div>
        <p className="tabular font-display leading-[0.8] text-brand text-[clamp(7rem,18vw,15rem)]">{day}</p>
        <p className="mt-2 text-2xl font-semibold uppercase tracking-[0.12em]">{month}</p>
      </div>
    </div>
  );
}

function EmptyEvents() {
  return (
    <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-6">
      <p data-split="lines" className="font-semibold text-ink text-display-md lg:col-span-7">
        The next drive is being <em className="font-display font-normal italic text-brand-700">planned.</em>
      </p>
      <div data-reveal className="lg:col-span-4 lg:col-start-9">
        <p className="text-[16px] leading-relaxed text-fg-2">
          When coordinators publish events, they appear here — with dates, places and how many volunteers are going.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href="/signup/student" arrow>
            Join as a volunteer
          </Button>
          <Button href="/signup/coordinator" variant="outline">
            Plan a drive
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EventsSection({ events }) {
  const [selected, setSelected] = useState(null);
  const root = useChoreography([events.length]);
  const [featured, ...rest] = events;

  return (
    <section ref={root} id="events" aria-labelledby="events-title" className="relative bg-canvas">
      <div className="container-editorial py-24 sm:py-32 lg:py-40">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel index="06">Events</SectionLabel>
            <h2 id="events-title" data-split="lines" className="mt-8 font-semibold text-ink text-display-lg">
              Where the hours <em className="font-display font-normal italic text-brand-700">happen.</em>
            </h2>
          </div>
          {events.length ? (
            <p data-reveal className="max-w-xs text-[15px] leading-relaxed text-muted">
              Drives published by NSS units on Synapsis. Sign in to register for one.
            </p>
          ) : null}
        </div>

        {!featured ? (
          <EmptyEvents />
        ) : (
          <>
            <article className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-6">
              <button
                type="button"
                data-clip
                data-cursor="Open"
                onClick={() => setSelected(featured)}
                aria-label={`View details for ${featured.title}`}
                className="group relative aspect-[4/3] overflow-hidden bg-mist lg:col-span-7 lg:aspect-auto lg:min-h-[520px]"
              >
                {featured.image ? (
                  <SmartImage
                    src={featured.image}
                    alt=""
                    sizes="(min-width: 1024px) 55vw, 92vw"
                    className="transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
                  />
                ) : (
                  <DatePoster date={featured.date} />
                )}
              </button>
              <div className="flex flex-col justify-between gap-10 lg:col-span-5 lg:py-2 lg:pl-6">
                <div>
                  <div data-reveal className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={featured.status} />
                    <span className="eyebrow text-subtle">Featured drive</span>
                  </div>
                  <h3 data-reveal className="mt-6 text-[clamp(2rem,3.4vw,3.1rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">
                    {featured.title}
                  </h3>
                  {featured.description ? (
                    <p data-reveal className="mt-5 line-clamp-4 max-w-lg text-[16px] leading-relaxed text-fg-2">
                      {featured.description}
                    </p>
                  ) : null}
                </div>
                <div data-reveal>
                  <Meta event={featured} />
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button variant="dark" arrow onClick={() => setSelected(featured)}>
                      View details
                    </Button>
                    <Button href="/login" variant="outline">
                      Sign in to register
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            {rest.length ? (
              <ul className="mt-20 border-t border-ink/80 lg:mt-28" aria-label="More events">
                {rest.map((event) => {
                  const { day, month } = parts(event.date);
                  return (
                    <li key={event.id} data-reveal className="border-b border-line">
                      <button
                        type="button"
                        data-cursor="Open"
                        onClick={() => setSelected(event)}
                        className="group grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-x-4 gap-y-2 py-6 text-left transition-colors hover:bg-paper sm:grid-cols-[6rem_1fr_auto] lg:grid-cols-[7rem_minmax(0,1.6fr)_minmax(0,1fr)_7rem_8rem_2.5rem] lg:gap-x-6 lg:px-2"
                      >
                        <span className="flex items-baseline gap-1.5">
                          <span className="tabular text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">{day}</span>
                          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{month}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[17px] font-semibold tracking-[-0.02em] text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1 sm:text-xl">
                            {event.title}
                          </span>
                          <span className="mt-1 block truncate text-[13px] text-muted lg:hidden">
                            {[event.location, `${event.hours} h`].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="hidden truncate text-[14px] text-fg-2 lg:block">{event.location || "Location to be announced"}</span>
                        <span className="tabular hidden text-[14px] text-fg-2 lg:block">{event.hours} hours</span>
                        <span className="hidden lg:block">
                          <StatusBadge status={event.status} />
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-5 justify-self-end text-subtle transition-all duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow="Event"
        title={selected?.title || ""}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button href="/login" arrow>
              Sign in to register
            </Button>
          </>
        }
      >
        {selected ? (
          <div>
            {selected.image ? (
              <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-lg bg-mist">
                <SmartImage src={selected.image} alt="" sizes="(min-width: 640px) 36rem, 100vw" />
              </div>
            ) : null}
            <StatusBadge status={selected.status} />
            <Meta event={selected} className="mt-6" />
            {selected.description ? (
              <div className="mt-8 border-t border-line pt-6">
                <p className="eyebrow mb-3 text-muted">About this drive</p>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg-2">{selected.description}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
