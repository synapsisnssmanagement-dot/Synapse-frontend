import "server-only";
import { API_URL } from "@/utils/config";

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 8000;

// The public list endpoints answer 404 when a collection is empty, so a 404 is
// "nothing yet", not a failure. Any other failure also yields an empty list so
// the landing page always renders.
async function getList(path, key) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.[key]) ? body[key] : [];
  } catch {
    return [];
  }
}

const STATUS_ORDER = { Ongoing: 0, Upcoming: 1, Completed: 2 };

function toPublicEvent(event) {
  return {
    id: String(event._id),
    title: event.title || "Untitled event",
    description: event.description || "",
    date: event.date || null,
    location: event.location || "",
    hours: Number(event.hours) || 0,
    status: event.status || "Upcoming",
    participants: Array.isArray(event.participants) ? event.participants.length : 0,
    image: event.images?.[0]?.url || null,
    donationEnabled: Boolean(event.donationOpen),
  };
}

export async function getAlbumImages() {
  const images = await getList("/api/events/getalleventimage", "images");
  return images
    .filter((img) => img?.url)
    .map((img, i) => ({
      id: String(img._id || img.public_id || i),
      url: img.url,
      caption: img.caption || "",
      eventTitle: img.eventTitle || "",
      eventDate: img.eventDate || null,
    }));
}

export async function getLandingData() {
  const [rawEvents, images, testimonials] = await Promise.all([
    getList("/api/events/getallevent", "events"),
    getList("/api/events/getalleventimage", "images"),
    getList("/api/alumni/testimonials/top", "testimonials"),
  ]);

  const completed = rawEvents.filter((e) => e.status === "Completed");
  const stats = {
    eventsCompleted: completed.length,
    volunteerHours: Math.round(
      completed.reduce(
        (sum, e) => sum + (Number(e.calculatedHours) || Number(e.hours) || 0) * (e.participants?.length || 0),
        0
      )
    ),
    volunteers: new Set(rawEvents.flatMap((e) => (e.participants || []).map(String))).size,
    institutions: new Set(rawEvents.map((e) => e.institution && String(e.institution)).filter(Boolean)).size,
  };

  const now = Date.now();
  const events = rawEvents
    .map(toPublicEvent)
    .sort((a, b) => {
      const byStatus = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (byStatus !== 0) return byStatus;
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return a.status === "Completed" ? db - da : Math.abs(da - now) - Math.abs(db - now);
    })
    .slice(0, 6);

  return {
    events,
    images: images
      .filter((img) => img?.url)
      .slice(0, 7)
      .map((img) => ({
        id: String(img._id || img.public_id || img.url),
        url: img.url,
        caption: img.caption || "",
        eventTitle: img.eventTitle || "",
        eventDate: img.eventDate || null,
      })),
    testimonials: testimonials.slice(0, 8).map((t, i) => ({
      id: String(t._id || i),
      name: t.name || "Synapsis alumni",
      department: t.department || "",
      graduationYear: t.graduationYear || "",
      message: t.message || "",
      image: t.profileImage || null,
    })),
    stats,
  };
}
