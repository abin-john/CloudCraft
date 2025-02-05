import { useState, useEffect } from "react";
import { Table, Container, Spinner, Alert } from "react-bootstrap";

export default function DeploymentRoster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/getDeploymentRoster")
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

    if (loading) return <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>;
    if (error) return <Alert variant="danger">Error: {error}</Alert>;

    return (
        <Container className="mt-4">
            <h2>Deployment Roster</h2>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Cloud Provider</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.date}>
                            <td>{item.date}</td>
                            <td>{item.provider}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}