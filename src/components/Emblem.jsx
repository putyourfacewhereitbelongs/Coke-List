/** Harry's signature circular badge — stylized cursive "H" over "SINCE 1991". */
export default function Emblem({ size = 54, mono = false }) {
  const red = mono ? '#0f172a' : '#C8102E';
  const dark = mono ? '#1e293b' : '#9E0018';
  return (
    <svg className="emblem" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Harry's Convenience Stores emblem">
      <circle cx="50" cy="50" r="49" fill={dark} />
      <circle cx="50" cy="50" r="46" fill={red} />
      <circle cx="50" cy="50" r="41.5" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.92" />
      <circle cx="50" cy="50" r="38.5" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.55" />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="46"
        fill="#fff"
      >
        H
      </text>
      <path d="M26 66 h48" stroke="#fff" strokeWidth="1.1" opacity="0.8" />
      <text
        x="50"
        y="77"
        textAnchor="middle"
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="9"
        letterSpacing="1.6"
        fill="#fff"
      >
        SINCE 1991
      </text>
      <text
        x="50"
        y="26"
        textAnchor="middle"
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="7.4"
        letterSpacing="1.5"
        fill="#ffd7dd"
      >
        HARRY'S
      </text>
    </svg>
  );
}
