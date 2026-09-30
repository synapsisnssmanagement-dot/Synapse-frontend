"use client";

import MentorshipChat from "@/features/shared/MentorshipChat";

// Rendered at the layout level so the conversation list and socket persist
// while moving between threads; the child pages only carry the URL.
export default function StudentMentorshipLayout() {
  return <MentorshipChat role="student" />;
}
