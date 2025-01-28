import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';


export default function NavBar() {
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
                            <Nav.Link href="#home">Confluence</Nav.Link>
                            <Nav.Link href="/new">Link</Nav.Link>
                            <NavDropdown title="GC Release Component" id="basic-nav-dropdown" menuVariant="dark">
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.1">Action</NavDropdown.Item>
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.2">Another action</NavDropdown.Item>
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.3">Something</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item className="bg-dark text-white" href="#action/3.4">Separated link</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}