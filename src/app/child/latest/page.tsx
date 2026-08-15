"use client";

import LessonView from "@/components/lesson-view";
import { useLessonStore } from "@/lib/lesson-store";
import { useMounted } from "@/lib/use-mounted";

export default function ChildLatestPage() {
  const mounted = useMounted();
  const { lesson } = useLessonStore();

  if (!mounted) {
    return (
      <div className="board-texture flex h-[100dvh] flex-col items-center justify-center gap-4 bg-board">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-pulse rounded-full border-2 border-chalk/30 border-t-chalk" />
          <p className="text-sm text-chalk-dim">Warming up the chalkboard…</p>
        </div>
      </div>
    );
  }

  return <LessonView lesson={lesson} />;
}
