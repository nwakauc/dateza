import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
  label: string;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function OtpInput({ value, onChange, disabled = false, describedBy, label }: Props) {
  const groupId = useId();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, index) => value[index] ?? "");

  function setDigitAt(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, LENGTH));
  }

  function focusIndex(index: number) {
    inputsRef.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const incoming = onlyDigits(raw);
    if (incoming.length === 0) {
      setDigitAt(index, "");
      return;
    }
    if (incoming.length > 1) {
      // A full code (or a chunk of one) landed in a single box — most likely
      // a paste that the browser routed to the input's change handler
      // instead of firing onPaste. Distribute it starting at this box.
      const next = value.split("");
      for (let offset = 0; offset < incoming.length && index + offset < LENGTH; offset += 1) {
        next[index + offset] = incoming[offset];
      }
      onChange(next.join("").slice(0, LENGTH));
      focusIndex(Math.min(index + incoming.length, LENGTH - 1));
      return;
    }
    setDigitAt(index, incoming);
    if (index < LENGTH - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = onlyDigits(event.clipboardData.getData("text"));
    if (pasted.length === 0) {
      return;
    }
    event.preventDefault();
    const next = value.split("");
    for (let offset = 0; offset < pasted.length && index + offset < LENGTH; offset += 1) {
      next[index + offset] = pasted[offset];
    }
    const filled = next.join("").slice(0, LENGTH);
    onChange(filled);
    focusIndex(Math.min(index + pasted.length, LENGTH - 1));
  }

  return (
    <div className="otp-input" role="group" aria-labelledby={groupId} aria-describedby={describedBy}>
      <span id={groupId} className="onboard-sr-only">
        {label}
      </span>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className="otp-input__box"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          disabled={disabled}
          aria-label={`${label}, digit ${index + 1} of ${LENGTH}`}
        />
      ))}
    </div>
  );
}
