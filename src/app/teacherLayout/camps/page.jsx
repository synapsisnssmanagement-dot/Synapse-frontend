import Camps from "@/features/ops/Camps";

export const metadata = { title: "Camps" };

export default function Page() {
  return <Camps base="/teacherLayout/camps" canCreate={false} />;
}
