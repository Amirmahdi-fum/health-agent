import { createFileRoute } from "@tanstack/react-router";
import { HeroProfile } from "@/components/profile/HeroProfile";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Health Agent` },
      { name: "description", content: `Public Health Agent profile for @${params.username}.` },
      { property: "og:title", content: `@${params.username} — Health Agent` },
      {
        property: "og:description",
        content: `Follow @${params.username}'s health & performance journey on Health Agent.`,
      },
      { property: "og:url", content: `/profile/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/profile/${params.username}` }],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs uppercase tracking-widest text-[color:var(--aura-fg-muted)] text-center mb-4">
          @{username}
        </div>
        <HeroProfile publicView stats={{ streak: 0, xp: 0, unlocked: [] }} />
      </div>
    </div>
  );
}
