/* Decorative SVG illustration — Saturn planet with rings and stars */
export default function SaturnIllustration({ size = 340 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 340 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 40px rgba(118,69,217,0.5))' }}
    >
      {/* Stars */}
      {[
        [30,40,2],[290,60,1.5],[310,180,2],[20,240,1.5],[280,290,1.5],
        [50,300,1],[140,20,1.5],[200,300,1],[80,180,1],[260,130,1],
      ].map(([cx,cy,r],i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={0.6 + Math.sin(i)*0.3} />
      ))}

      {/* Ring shadow (behind planet) */}
      <ellipse cx="170" cy="178" rx="130" ry="26" fill="none"
        stroke="url(#ringGrad)" strokeWidth="22" strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="410 0"
        clipPath="url(#ringBackClip)"
      />

      {/* Planet body */}
      <defs>
        <radialGradient id="planetGrad" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#A881FC" />
          <stop offset="45%" stopColor="#7645D9" />
          <stop offset="100%" stopColor="#280D5F" />
        </radialGradient>
        <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB237" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F0922C" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#9B6CF4" stopOpacity="0.2" />
        </radialGradient>
        <clipPath id="ringBackClip">
          <rect x="0" y="178" width="340" height="170" />
        </clipPath>
        <clipPath id="ringFrontClip">
          <rect x="0" y="0" width="340" height="178" />
        </clipPath>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx="170" cy="170" r="88" fill="url(#planetGrad)" />

      {/* Planet surface bands */}
      <ellipse cx="170" cy="152" rx="82" ry="12" fill="rgba(255,255,255,0.06)" />
      <ellipse cx="170" cy="175" rx="82" ry="8"  fill="rgba(255,255,255,0.04)" />
      <ellipse cx="170" cy="196" rx="78" ry="10" fill="rgba(255,255,255,0.05)" />

      {/* Planet highlight */}
      <ellipse cx="148" cy="140" rx="30" ry="18" fill="rgba(255,255,255,0.12)" />

      {/* Ring front (over planet) */}
      <ellipse cx="170" cy="178" rx="130" ry="26" fill="none"
        stroke="url(#ringGrad)" strokeWidth="22" strokeLinecap="round"
        clipPath="url(#ringFrontClip)"
      />

      {/* Ticket decorations */}
      <g transform="translate(270, 80) rotate(15)">
        <rect x="0" y="0" width="44" height="22" rx="4" fill="#FFB237" opacity="0.9" />
        <rect x="0" y="0" width="44" height="22" rx="4" fill="none" stroke="#F0922C" strokeWidth="1" />
        <line x1="14" y1="0" x2="14" y2="22" stroke="#F0922C" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="7" cy="11" r="3" fill="#280D5F" />
        <rect x="18" y="7" width="20" height="3" rx="1.5" fill="#280D5F" opacity="0.5" />
        <rect x="18" y="13" width="14" height="2" rx="1" fill="#280D5F" opacity="0.4" />
      </g>
      <g transform="translate(40, 100) rotate(-12)">
        <rect x="0" y="0" width="36" height="18" rx="3" fill="#9B6CF4" opacity="0.85" />
        <line x1="11" y1="0" x2="11" y2="18" stroke="#7645D9" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="5.5" cy="9" r="2.5" fill="#280D5F" opacity="0.6" />
      </g>

      {/* Sparkles */}
      {[[60,60],[300,100],[250,260],[80,260]].map(([x,y],i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#FFB237" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#FFB237" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FFB237" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FFB237" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </g>
      ))}

      {/* Gold coins / CAKE tokens */}
      <circle cx="300" cy="240" r="14" fill="#FFB237" opacity="0.85" />
      <circle cx="300" cy="240" r="10" fill="#F0922C" />
      <text x="300" y="244" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">S</text>

      <circle cx="38" cy="200" r="10" fill="#9B6CF4" opacity="0.7" />
      <circle cx="38" cy="200" r="7" fill="#7645D9" />
    </svg>
  );
}
