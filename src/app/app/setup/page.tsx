import { ProfileWizard } from "@/components/features/profile-wizard/ProfileWizard";

export const metadata = { title: "Build your profile — UniFit" };

export default function SetupPage() {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-h1 font-semibold text-stone-900">Let&apos;s build your profile</h1>
        <p className="mt-1 text-body text-stone-500">
          Five short steps. Your answers save automatically, so it&apos;s safe to come back later.
        </p>
      </div>
      <ProfileWizard />
    </div>
  );
}
