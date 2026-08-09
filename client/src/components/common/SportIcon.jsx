// `league` is an optional override for leagues that need a distinct icon despite
// sharing a sport grouping with others — e.g. World Cup groups under SOCCER
// (same tile as EPL/La Liga in the team strip) but gets its own globe icon
// wherever a specific league, not just the sport, is known.
function SportIcon({ sport, league, size = 20, className }) {
  const props = {
    viewBox: '0 0 20 20',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    width: size,
    height: size,
    className,
  };

  if (league === 'WC') {
    return (
      <svg {...props}>
        <circle cx="10" cy="10" r="9" fill="#1a6fb5" />
        <ellipse cx="10" cy="10" rx="4" ry="9" fill="none" stroke="#7ec8e3" strokeWidth="0.8" />
        <ellipse cx="10" cy="10" rx="7" ry="9" fill="none" stroke="#7ec8e3" strokeWidth="0.5" />
        <line x1="1" y1="10" x2="19" y2="10" stroke="#7ec8e3" strokeWidth="0.8" />
        <line x1="2.5" y1="5.5" x2="17.5" y2="5.5" stroke="#7ec8e3" strokeWidth="0.5" />
        <line x1="2.5" y1="14.5" x2="17.5" y2="14.5" stroke="#7ec8e3" strokeWidth="0.5" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#0d4a8a" strokeWidth="0.8" />
      </svg>
    );
  }
  if (sport === 'BASKETBALL') {
    return (
      <svg {...props}>
        <circle cx="10" cy="10" r="9" fill="#e87722" />
        <path d="M1 10h18M10 1v18" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <path d="M6,1.94 Q2.2,10 6,18.06" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <path d="M14,1.94 Q17.8,10 14,18.06" stroke="#7a2e00" strokeWidth="1" fill="none" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#7a2e00" strokeWidth="0.8" />
      </svg>
    );
  }
  if (sport === 'SOCCER') {
    return (
      <svg {...props}>
        <circle cx="10" cy="10" r="9" fill="#f0f0f0" />
        <polygon points="10,6.8 12.1,8.4 11.3,10.9 8.7,10.9 7.9,8.4" fill="#111" />
        <polygon points="10,1.2 11.2,3.2 8.8,3.2" fill="#111" />
        <polygon points="17.4,6.4 15.6,7.2 15.2,5.2" fill="#111" />
        <polygon points="16.2,15.2 14.2,14.6 15.4,12.8" fill="#111" />
        <polygon points="3.8,15.2 5.8,14.6 4.6,12.8" fill="#111" />
        <polygon points="2.6,6.4 4.4,7.2 4.8,5.2" fill="#111" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#555" strokeWidth="0.8" />
      </svg>
    );
  }
  if (sport === 'AFL') {
    return (
      <svg {...props}>
        <ellipse cx="10" cy="10" rx="5.5" ry="9" fill="#8B2500" />
        <line x1="10" y1="6" x2="10" y2="14" stroke="#fff" strokeWidth="1.2" />
        <line x1="7.8" y1="7.2" x2="12.2" y2="7.2" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.4" y1="9" x2="12.6" y2="9" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.4" y1="10.8" x2="12.6" y2="10.8" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <line x1="7.8" y1="12.6" x2="12.2" y2="12.6" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.2,0.8" />
        <ellipse cx="10" cy="10" rx="5.5" ry="9" fill="none" stroke="#5a1800" strokeWidth="0.8" />
      </svg>
    );
  }
  if (sport === 'GRIDIRON') {
    return (
      <svg {...props}>
        <ellipse cx="10" cy="10" rx="9" ry="5.5" fill="#7b4a2d" />
        <line x1="6" y1="10" x2="14" y2="10" stroke="#fff" strokeWidth="1.2" />
        <line x1="8.5" y1="8" x2="8.5" y2="12" stroke="#fff" strokeWidth="0.8" />
        <line x1="10" y1="7.6" x2="10" y2="12.4" stroke="#fff" strokeWidth="0.8" />
        <line x1="11.5" y1="8" x2="11.5" y2="12" stroke="#fff" strokeWidth="0.8" />
        <ellipse cx="10" cy="10" rx="9" ry="5.5" fill="none" stroke="#4a2c18" strokeWidth="0.8" />
      </svg>
    );
  }
  if (sport === 'HOCKEY') {
    return (
      <svg {...props}>
        <ellipse cx="10" cy="9.5" rx="9" ry="3.2" fill="#2b2b2b" />
        <ellipse cx="10" cy="9.5" rx="9" ry="3.2" fill="none" stroke="#000" strokeWidth="0.6" />
      </svg>
    );
  }
  if (sport === 'BASEBALL') {
    return (
      <svg {...props}>
        <circle cx="10" cy="10" r="9" fill="#f7f3e8" />
        <path d="M4,3 Q9,10 4,17" stroke="#c8102e" strokeWidth="0.8" fill="none" />
        <path d="M16,3 Q11,10 16,17" stroke="#c8102e" strokeWidth="0.8" fill="none" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="#999" strokeWidth="0.6" />
      </svg>
    );
  }
  return null;
}

export default SportIcon;
