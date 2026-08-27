import { DatingLocationPicker } from "../location/DatingLocationPicker.tsx";

type Props = {
  onSuccess: () => void;
};

/** Shared two-option dating-location flow used by onboarding and Discover/Find. */
export function LocationStep({ onSuccess }: Props) {
  return <DatingLocationPicker showPrivacyCopy={false} onSaved={() => onSuccess()} />;
}
