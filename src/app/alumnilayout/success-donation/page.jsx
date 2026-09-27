import { Suspense } from "react";
import SuccessDonation from "@/features/Alumni/SuccessDonation";

export const metadata = { title: "Thank you" };

export default function Page() {
  return (
    <Suspense>
      <SuccessDonation />
    </Suspense>
  );
}
