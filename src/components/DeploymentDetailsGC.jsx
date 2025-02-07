import { useLocation } from 'react-router';
import { Container, Table } from 'react-bootstrap';

export default function DeploymentDetailsGC() {
    const location = useLocation();
    const { item } = location.state || {};

    if (!item) {
        return <Container className="mt-4"><p>No details available.</p></Container>;
    }

    return (
        <Container className="mt-4">
            <h2>Deployment Details (GC)</h2>
            <Table striped bordered hover>
                <tbody>
                    <tr>
                        <th>Date</th>
                        <td>{item.date}</td>
                    </tr>
                    <tr>
                        <th>Cloud Provider</th>
                        <td>{item.provider}</td>
                    </tr>
                    <tr>
                        <th>Created User</th>
                        <td>{item.created_usr}</td>
                    </tr>
                    <tr>
                        <th>Last Updated User</th>
                        <td>{item.last_updated_usr}</td>
                    </tr>
                    <tr>
                        <th>Is Locked</th>
                        <td>{item.is_locked}</td>
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
                    {item.queues.map((queue, index) => (
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
                    {item.DataTable.map((dataTable, index) => (
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