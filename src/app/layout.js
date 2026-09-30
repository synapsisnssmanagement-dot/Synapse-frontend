import "./globals.css";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { SocketProvider } from "@/context/SocketContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:5173");

const description =
  "Synapsis connects NSS coordinators, teachers, volunteers and alumni in one place — events, attendance, volunteer hours, certificates, mentorship and donations.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Synapsis — NSS Management System",
    template: "%s · Synapsis",
  },
  description,
  applicationName: "Synapsis",
  openGraph: {
    type: "website",
    siteName: "Synapsis",
    title: "Synapsis — Where service becomes impact",
    description,
    images: [{ url: "/Images/IMG3.png", width: 1024, height: 1024, alt: "NSS volunteers spending time with elders" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synapsis — Where service becomes impact",
    description,
    images: ["/Images/IMG3.png"],
  },
};

export const viewport = {
  themeColor: "#0a0f1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        {/* Flags JS before first paint so intro elements can start hidden without a flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <SocketProvider>
          <Toaster position="bottom-right" richColors closeButton />
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
