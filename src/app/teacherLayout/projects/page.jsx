import Projects from "@/features/ops/Projects";

export const metadata = { title: "Projects" };

export default function Page() {
  return <Projects base="/teacherLayout/projects" canCreate={false} />;
}
