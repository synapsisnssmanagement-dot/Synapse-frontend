import { Suspense } from "react";
import Login from "@/features/Login/Login";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Synapsis workspace.",
};

export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
