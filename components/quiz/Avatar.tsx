"use client";

import dynamic from "next/dynamic";
import type { AvatarKind } from "@/lib/profile";
import type { Mood } from "./Avatar3D";

export type { Mood };

/** three.js only runs in the browser, so the 3D canvas is loaded client-side. */
const Avatar3D = dynamic(() => import("./Avatar3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-signal" />
    </div>
  ),
});

export default function Avatar(props: { kind: AvatarKind; mood?: Mood; moodKey?: number; className?: string }) {
  return <Avatar3D {...props} />;
}
