import { Suspense } from "react";
import VerifyOtp from "@/features/VerifyOtp";

export const metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <VerifyOtp />
    </Suspense>
  );
}
