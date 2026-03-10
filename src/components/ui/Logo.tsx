interface LogoProps {
    size?: number;
    className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            fill="none"
            width={size}
            height={size}
            className={className}
        >
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                <linearGradient id="logoShine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>

            {/* Rounded square background */}
            <rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="url(#logoGrad)" />
            <rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="url(#logoShine)" />

            {/* Car body */}
            <path
                d="M55 120 L60 95 Q65 80 80 75 L120 75 Q135 80 140 95 L145 120"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Car roof */}
            <path
                d="M75 75 L80 58 Q85 50 100 50 Q115 50 120 58 L125 75"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Car base */}
            <line x1="42" y1="120" x2="158" y2="120" stroke="white" strokeWidth="6" strokeLinecap="round" />

            {/* Left wheel */}
            <circle cx="72" cy="120" r="14" fill="white" opacity="0.9" />
            <circle cx="72" cy="120" r="7" fill="#2563eb" />

            {/* Right wheel */}
            <circle cx="128" cy="120" r="14" fill="white" opacity="0.9" />
            <circle cx="128" cy="120" r="7" fill="#2563eb" />

            {/* Shield checkmark accent */}
            <g transform="translate(140, 30)">
                <path
                    d="M15 5 Q15 2 18 2 L30 2 Q33 2 33 5 L33 18 Q33 25 24 30 Q15 25 15 18 Z"
                    fill="white"
                    opacity="0.2"
                />
                <polyline
                    points="20,16 23,20 29,12"
                    stroke="white"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                />
            </g>
        </svg>
    );
}
