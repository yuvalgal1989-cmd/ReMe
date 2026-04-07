import { useState } from 'react';

interface Props {
  title: string;
  message: string;
}

/**
 * A dismissible inline banner used to tell the user that a feature
 * is unavailable or not yet set up.  Shows a clear title, a short
 * explanation, and an × button to dismiss.
 */
export default function FeatureUnavailable({ title, message }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
      <span className="text-lg flex-shrink-0 mt-0.5">🚧</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{message}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none p-1 -mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
