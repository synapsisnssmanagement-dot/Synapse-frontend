import EventsSection from "./EventsSection";
import Features from "./Features";
import FinalCta from "./FinalCta";
import GallerySection from "./GallerySection";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Journey from "./Journey";
import Manifesto from "./Manifesto";
import Mentorship from "./Mentorship";
import SiteFooter from "./SiteFooter";
import SiteNav from "./SiteNav";
import Testimonials from "./Testimonials";
import { siteLinks } from "./content";
import { getLandingData } from "./data";

const pad = (n) => String(n).padStart(2, "0");

export default async function Home() {
  const { events, images, testimonials, stats } = await getLandingData();
  const links = siteLinks({ hasTestimonials: testimonials.length > 0 });

  // Sections 09 and 10 only render when there is real content, so number the tail dynamically.
  let next = 8;
  const galleryIndex = images.length ? pad(++next) : null;
  const voicesIndex = testimonials.length ? pad(++next) : null;
  const joinIndex = pad(++next);

  return (
    <>
      <SiteNav links={links} />
      <main id="main">
        <Hero />
        <Manifesto stats={stats} />
        <HowItWorks />
        <Features />
        <EventsSection events={events} />
        <Journey />
        <Mentorship />
        {galleryIndex ? <GallerySection images={images} index={galleryIndex} /> : null}
        {voicesIndex ? <Testimonials items={testimonials} index={voicesIndex} /> : null}
        <FinalCta index={joinIndex} />
      </main>
      <SiteFooter links={links} />
    </>
  );
}
