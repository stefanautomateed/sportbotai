/**
 * Warnings Section Component
 * 
 * Displays meta.warnings as a list of alert messages.
 */

'use client';

interface WarningsSectionProps {
  warnings: string[];
}

export default function WarningsSection({ warnings }: WarningsSectionProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <span>ℹ️</span>
        Analysis Notes
      </h3>
      
      <ul className="space-y-2">
        {warnings.map((warning, index) => (
          <li 
            key={index} 
            className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-white rounded border border-gray-100"
          >
            <span className="text-accent-gold flex-shrink-0">•</span>
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
