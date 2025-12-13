/**
 * Form Sparkline Component
 * 
 * A compact visualization of team form (W-W-L-D-W pattern)
 * Can be used in MatchCard, tables, or anywhere space is limited.
 */

'use client';

interface FormSparklineProps {
  form: ('W' | 'D' | 'L')[];
  size?: 'xs' | 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: { dot: 'w-1.5 h-1.5', gap: 'gap-0.5', text: 'text-[8px]' },
  sm: { dot: 'w-2 h-2', gap: 'gap-1', text: 'text-[10px]' },
  md: { dot: 'w-2.5 h-2.5', gap: 'gap-1.5', text: 'text-xs' },
};

const resultColors = {
  W: 'bg-green-500',
  D: 'bg-yellow-500',
  L: 'bg-red-500',
};

const resultColorsText = {
  W: 'text-green-500',
  D: 'text-yellow-500',
  L: 'text-red-500',
};

export default function FormSparkline({
  form,
  size = 'sm',
  showLabels = false,
  className = '',
}: FormSparklineProps) {
  if (!form || form.length === 0) {
    return (
      <div className={`flex items-center ${sizeConfig[size].gap} ${className}`}>
        <span className="text-gray-500 text-xs">No data</span>
      </div>
    );
  }

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {form.map((result, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`
              ${config.dot} 
              ${resultColors[result]} 
              rounded-full 
              transition-transform 
              hover:scale-125
              shadow-sm
            `}
            title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
          />
          {showLabels && (
            <span className={`${config.text} ${resultColorsText[result]} font-medium mt-0.5`}>
              {result}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Form Trend Mini Chart
 * 
 * An SVG sparkline showing form trend over time
 */
interface FormTrendMiniProps {
  form: ('W' | 'D' | 'L')[];
  width?: number;
  height?: number;
  className?: string;
}

export function FormTrendMini({
  form,
  width = 60,
  height = 20,
  className = '',
}: FormTrendMiniProps) {
  if (!form || form.length < 2) {
    return null;
  }

  // Convert form to points: W=3, D=1, L=0
  const points: number[] = form.map(result => {
    if (result === 'W') return 3;
    if (result === 'D') return 1;
    return 0;
  });

  // Calculate chart coordinates
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const xStep = chartWidth / (points.length - 1);

  // Create path points
  const pathPoints = points.map((val, i) => {
    const x = padding + i * xStep;
    const y = padding + chartHeight - (val / 3) * chartHeight;
    return { x, y };
  });

  // Create smooth curve path
  const linePath = pathPoints.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Create area fill path
  const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  // Calculate trend direction
  const avgFirst = points.slice(0, Math.floor(points.length / 2)).reduce((a: number, b: number) => a + b, 0);
  const avgSecond = points.slice(Math.floor(points.length / 2)).reduce((a: number, b: number) => a + b, 0);
  const isPositive = avgSecond >= avgFirst;

  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      {/* Area fill */}
      <path
        d={areaPath}
        fill={fillColor}
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots at each point */}
      {pathPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={resultColors[form[i]]}
          className="transition-all hover:r-3"
        />
      ))}
    </svg>
  );
}
