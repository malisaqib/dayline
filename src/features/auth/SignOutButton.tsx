import { signOut } from "@/app/auth-actions";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";

export function SignOutButton({ className = ui.secondaryButton }: { className?: string }) {
  return (
    <form action={signOut}>
      <PendingButton label="Sign out" className={className} />
    </form>
  );
}
