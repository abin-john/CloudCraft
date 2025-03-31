import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useOktaAuth } from '@okta/okta-react';
import { useLocation } from 'react-router-dom';

export default function NavBar() {
    const { authState, oktaAuth } = useOktaAuth();
    const location = useLocation();
    const login = async () => oktaAuth.signInWithRedirect({ originalUri: location.pathname });

    if (!authState) {
        return null;
    }

    const userName = authState.isAuthenticated ? authState.idToken.claims.name : '';

    return (
        <>
            <Navbar expand="lg" className="bg-dark navbar-dark custom-navbar px-4">
                <img
                    src="/devops_fav.png"
                    alt="CloudCraft Logo"
                    width="30"
                    height="30"
                    className="d-inline-block align-top me-2"
                />
                <Navbar.Brand href="/">Ops CloudCraft</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/deploymentroster">Deployment Roster</Nav.Link>
                        {authState.isAuthenticated && (
                            <Nav.Link href="/new">DevOps Tools</Nav.Link>
                        )}
                    </Nav>
                    <Nav className="ms-auto">
                        {authState.isAuthenticated ? (
                            <>
                                <Nav.Link>Welcome, {userName}</Nav.Link>
                            </>
                        ) : (
                            <Nav.Link onClick={login}>Login</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </>
    );
}