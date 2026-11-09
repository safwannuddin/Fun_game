"use client";

import { useEffect, useState } from "react";
import { DAYS, starsFor } from "@/lib/journey";
import { currentProfile, saveProfile, signIn, signOut, type AvatarKind, type Profile } from "@/lib/profile";
import Welcome from "./Welcome";
import Login from "./Login";
import AvatarPick from "./AvatarPick";
import StoryIntro from "./StoryIntro";
import DayMap from "./DayMap";
import DayPlay from "./DayPlay";

/** Top-level flow: welcome → sign in → choose avatar → story → day map ⇄ day. */
export default function Journey() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [welcomed, setWelcomed] = useState(false);

  useEffect(() => {
    setProfile(currentProfile());
    setReady(true);
  }, []);

  const update = (p: Profile) => {
    saveProfile(p);
    setProfile({ ...p });
  };

  if (!ready) return null;

  if (!profile && !welcomed) return <Welcome onStart={() => setWelcomed(true)} />;

  if (!profile) return <Login onSignIn={(email, name) => setProfile(signIn(email, name))} />;

  if (!profile.avatar)
    return <AvatarPick playerName={profile.playerName} onPick={(kind: AvatarKind, characterName) => update({ ...profile, avatar: kind, characterName })} />;

  if (!profile.storySeen)
    return <StoryIntro kind={profile.avatar} name={profile.characterName} onDone={() => (update({ ...profile, storySeen: true }), setPlaying(1))} />;

  if (playing !== null) {
    const day = DAYS.find((d) => d.day === playing)!;
    const hasNext = playing < DAYS.length;
    return (
      <DayPlay
        key={playing}
        day={day}
        kind={profile.avatar}
        name={profile.characterName}
        onExit={() => setPlaying(null)}
        onFinish={(correct) => {
          const stars = starsFor(correct, day.questions.length);
          const prev = profile.days[day.day];
          update({
            ...profile,
            xp: profile.xp + correct * 10,
            days: {
              ...profile.days,
              [day.day]: { stars: Math.max(prev?.stars ?? 0, stars), best: Math.max(prev?.best ?? 0, correct) },
            },
          });
        }}
        onNextDay={hasNext ? () => setPlaying(playing + 1) : null}
      />
    );
  }

  return (
    <DayMap
      profile={profile}
      onPlay={(d) => setPlaying(d)}
      onSignOut={() => {
        signOut();
        setProfile(null);
      }}
    />
  );
}
