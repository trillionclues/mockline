export const MocklineWordmark = ({ size = 15 }: { size?: number }) => {
    return (
        <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            fontSize: `${size}px`,
            color: '#f4f4f5',
            letterSpacing: '-0.01em',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
        }}>
            Mock
            <span style={{
                position: 'relative',
                display: 'inline-block',
                width: `${size * 0.28}px`,
                marginLeft: '0.5px',
                marginRight: '0.5px',
            }}>
                <span style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: `${size * -0.55}px`,
                    bottom: `${size * -0.35}px`,
                    width: '1.5px',
                    background: '#F2E3BB',
                    borderRadius: '1px',
                }} />
            </span>
            ine
        </span>
    )
}

export const MocklineLogo = () => {
    return (
        <svg width="30" height="30" viewBox="0 0 18 18" fill="none">
            <line x1="4" y1="15" x2="4" y2="8"
                stroke="#F2E3BB" strokeWidth="1.7" strokeLinecap="round" />
            <polyline points="2,10 4,6.5 6,10"
                stroke="#F2E3BB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polyline points="4,15 9,11 14,15"
                stroke="#F2E3BB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="14" y1="15" x2="14" y2="8"
                stroke="#F2E3BB" strokeWidth="1.7" strokeLinecap="round" />
            <polyline points="12,10 14,6.5 16,10"
                stroke="#F2E3BB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    )
}