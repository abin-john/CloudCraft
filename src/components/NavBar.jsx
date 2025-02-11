import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useOktaAuth } from '@okta/okta-react';


export default function NavBar() {
    const { authState, oktaAuth } = useOktaAuth()
    const login = async () => oktaAuth.signInWithRedirect()
    const logout = async () => oktaAuth.signOut()

    if (!authState) {
        return null;
    }

    return (
        <>
            <Navbar expand="lg" className="bg-dark navbar-dark custom-navbar">
                <Container>
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
                            <Nav.Link href="/deploymentroster">Deploymet Roster</Nav.Link>
                            <NavDropdown title="Deployment Roster" id="basic-nav-dropdown" menuVariant="dark">
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.1">AWS</NavDropdown.Item>
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.2">GC</NavDropdown.Item>
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.3">Something</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.4">Separated link</NavDropdown.Item>
                            </NavDropdown>
                            {authState.isAuthenticated && (
                                <Nav.Link href="/new">Link</Nav.Link>
                            )}
                            {authState.isAuthenticated && (
                                <Nav.Link onClick={logout}>Logout</Nav.Link>
                            )}
                            {!authState.isAuthenticated && (
                                <Nav.Link onClick={login}>Login</Nav.Link>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}