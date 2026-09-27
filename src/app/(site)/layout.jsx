import SmoothScroll from "@/lib/motion/SmoothScroll";
import Cursor from "@/lib/motion/Cursor";

export default function SiteLayout({ children }) {
  return (
    <SmoothScroll>
      <Cursor />
      {children}
    </SmoothScroll>
  );
}
