import { useState, useEffect } from "react";
import { Table, Container, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate, Outlet, useLocation } from 'react-router';

export default function DeploymentRoster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetch("https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    );
    if (error) return <Alert variant="danger">Error: {error}</Alert>;

    const handleRowClick = (item) => {
        if (item.provider === 'gc') {
            navigate(`/deploymentroster/details/gc/${item.date}/${item.provider}`);
        } else {
            navigate(`/deploymentroster/details/aws/${item.date}/${item.provider}`);
        }
    };

    const isDetailsPage = location.pathname.includes('/deploymentroster/details/');

    return (
        <>
            <Container fluid className="mt-4">
                {!isDetailsPage && (
                    <>
                        <h2>Deployment Roster</h2>
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Date</th>
                                    <th>Cloud Provider</th>
                                    <th>Created User</th>
                                    <th>Last Updated User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={`${item.date}-${item.provider}`}>
                                        <td>
                                            <Button variant="link" onClick={() => handleRowClick(item)}>
                                                {item.date}
                                            </Button>
                                        </td>
                                        <td>{item.provider}</td>
                                        <td>{item.created_usr}</td>
                                        <td>{item.last_updated_usr}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
                <Outlet />
            </Container>
        </>
    );
}