import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';

export default function DeploymentDetailsGC() {
    const { provider, date } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster/details?date=${date}&provider=${provider}`)
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
    }, [date, provider]);

    if (loading) return <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>;
    if (error) return <Alert variant="danger">Error: {error}</Alert>;
    if (!data) return <Container className="mt-4"><p>No details available.</p></Container>;

    return (
        <Container className="mt-4">
            <h2>Deployment Details (GC)</h2>
            <Table striped bordered hover>
                <tbody>
                    <tr>
                        <th>Date</th>
                        <td>{data.date}</td>
                    </tr>
                    <tr>
                        <th>Cloud Provider</th>
                        <td>{data.provider}</td>
                    </tr>
                    <tr>
                        <th>Created User</th>
                        <td>{data.created_usr}</td>
                    </tr>
                    <tr>
                        <th>Last Updated User</th>
                        <td>{data.last_updated_usr}</td>
                    </tr>
                    <tr>
                        <th>Is Locked</th>
                        <td>{data.is_locked}</td>
                    </tr>
                </tbody>
            </Table>

            <h3>Queues</h3>
            <Table striped bordered hover>
                <thead className="bg-primary text-white">
                    <tr>
                        <th>Name</th>
                        <th>Division</th>
                    </tr>
                </thead>
                <tbody>
                    {data.queues.map((queue, index) => (
                        <tr key={index}>
                            <td>{queue.name}</td>
                            <td>{queue.Division}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <h3>Data Tables</h3>
            <Table striped bordered hover>
                <thead className="bg-primary text-white">
                    <tr>
                        <th>Name</th>
                        <th>Division</th>
                    </tr>
                </thead>
                <tbody>
                    {data.DataTable.map((dataTable, index) => (
                        <tr key={index}>
                            <td>{dataTable.name}</td>
                            <td>{dataTable.Division}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}