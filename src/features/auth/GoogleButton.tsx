import { startGoogle } from "@/app/auth-actions";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";

export function GoogleButton({ next, label = "Continue with Google" }: { next: string; label?: string }) {
  return (
    <form action={startGoogle} className="mt-6">
      <input type="hidden" name="next" value={next} />
      <PendingButton label={label} className={`${ui.secondaryButton} w-full gap-3`} />
    </form>
  );
}
