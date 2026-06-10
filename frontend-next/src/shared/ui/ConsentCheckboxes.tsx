'use client';

import Link from 'next/link';

interface Props {
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  onMarketingChange?: (checked: boolean) => void;
  termsChecked: boolean;
  privacyChecked: boolean;
  marketingChecked: boolean;
  showMarketing?: boolean;
}

export default function ConsentCheckboxes({
  onTermsChange, onPrivacyChange, onMarketingChange,
  termsChecked, privacyChecked, marketingChecked,
  showMarketing = false,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsChecked}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
        />
        <span className="text-sm text-[var(--text-muted)]">
          I accept the{' '}
          <Link href="/terms" target="_blank" className="underline hover:text-[var(--primary-color)]">
            Terms of Service
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={privacyChecked}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
        />
        <span className="text-sm text-[var(--text-muted)]">
          I have read and understood the{' '}
          <Link href="/privacy" target="_blank" className="underline hover:text-[var(--primary-color)]">
            Privacy Policy
          </Link>
        </span>
      </label>

      {showMarketing && (
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingChecked}
            onChange={(e) => onMarketingChange?.(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
          />
          <span className="text-sm text-[var(--text-muted)]">
            I agree to receive product updates and newsletters (optional)
          </span>
        </label>
      )}
    </div>
  );
}