import { Images } from "lucide-react";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import AlbumGrid from "./AlbumGrid";
import SiteFooter from "./SiteFooter";
import SiteNav from "./SiteNav";
import { siteLinks } from "./content";
import { getAlbumImages } from "./data";

export default async function Album() {
  const images = await getAlbumImages();
  const links = siteLinks({ onHome: false });
  const events = new Set(images.map((image) => image.eventTitle).filter(Boolean)).size;

  return (
    <>
      <SiteNav links={links} />
      <main id="main" className="bg-paper">
        <div className="container-editorial pb-24 pt-32 sm:pt-40">
          <header className="grid gap-8 border-b border-line pb-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-8">
              <p className="eyebrow flex items-center gap-3 text-muted">
                <span aria-hidden="true" className="h-px w-10 bg-brand" />
                Event album
              </p>
              <h1 className="mt-8 font-semibold text-ink text-display-xl">
                Moments of <em className="font-display font-normal italic text-brand-700">service.</em>
              </h1>
            </div>
            <div className="lg:col-span-3 lg:col-start-10 lg:self-end">
              <p className="text-[15px] leading-relaxed text-fg-2">
                Photographs uploaded by NSS units after their drives — the people, places and afternoons behind the hours.
              </p>
              {images.length ? (
                <p className="tabular mt-5 text-[13px] font-semibold text-muted">
                  {images.length} photographs{events ? ` from ${events} ${events === 1 ? "event" : "events"}` : ""}
                </p>
              ) : null}
            </div>
          </header>

          <div className="mt-12">
            {images.length ? (
              <AlbumGrid images={images} />
            ) : (
              <EmptyState
                icon={Images}
                title="No photographs yet"
                description="When coordinators and volunteers upload memories from their drives, they will appear here."
                action={
                  <Button href="/" variant="outline">
                    Back to Synapsis
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter links={links} />
    </>
  );
}
