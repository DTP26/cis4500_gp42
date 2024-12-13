import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

function NavText({ href, text, isMain, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '30px' }}>
            <Typography
                variant={isMain ? 'h5' : 'h7'}
                noWrap
                style={{
                    fontFamily: isMain ? "'Press Start 2P', 'monospace'" : "'Orbitron', 'monospace'",
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: color || (isMain ? '#39ff14' : '#004d00'),
                }}
            >
                <NavLink
                    to={href}
                    style={{
                        color: 'inherit',
                        textDecoration: 'none',
                    }}
                >
                    {text}
                </NavLink>
            </Typography>
            {isMain && (
                <Typography
                    variant="body2"
                    style={{
                        fontFamily: "'Orbitron', 'monospace'",
                        fontWeight: 400,
                        fontSize: '0.5rem',
                        color: '#39ff14',
                        textAlign: 'center',
                        marginTop: '1px',
                    }}
                >
                    Holistically Integrated Screen CrossOver Recommendations Engine
                </Typography>
            )}
        </div>
    );
}

// NavBar Component
export default function NavBar() {
    return (
        <AppBar
            position="static"
            style={{
                background: 'linear-gradient(100deg, #004d00, #39ff14)',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar
                    disableGutters
                    style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                    }}
                >
                    <NavText href="/movies" text="MOVIES" color="#39ff14" />
                    <NavText href="/" text="HI SCORE!" isMain color="#ffffff"/>
                    <NavText href="/games" text="GAMES" color="#004d00" />
                </Toolbar>
            </Container>
        </AppBar>
    );
}