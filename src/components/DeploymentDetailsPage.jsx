import { useLocation } from 'react-router';
import { Container, Table } from 'react-bootstrap';

export default function DeploymentDetailsPage() {
    const location = useLocation();
    const { item } = location.state || {};

    if (!item) {
        return <Container className="mt-4"><p>No details available.</p></Container>;
    }

    return (
        <Container className="mt-4">
            <h2>Deployment Details</h2>
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
                </tbody>
            </Table>

            <h3>Lambda Functions</h3>
            <Table striped bordered hover>
                <thead className="bg-primary text-white">
                    <tr>
                        <th>App</th>
                        <th>Owner</th>
                        <th>Additional Configs</th>
                        <th>Function Name</th>
                        <th>Scrum Team</th>
                    </tr>
                </thead>
                <tbody>
                    {item.lambda.map((lambda, index) => (
                        <tr key={index}>
                            <td>{lambda.app}</td>
                            <td>{lambda.owner}</td>
                            <td>{lambda.additional_configs}</td>
                            <td>{lambda.function_name}</td>
                            <td>{lambda.scrum_team}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <h3>Contact Flows</h3>
            <Table striped bordered hover>
                <thead className="bg-primary text-white">
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>New</th>
                        <th>Bitbucket Link</th>
                    </tr>
                </thead>
                <tbody>
                    {item.contact_flows.map((flow, index) => (
                        <tr key={index}>
                            <td>{flow.name}</td>
                            <td>{flow.type}</td>
                            <td>{flow.new}</td>
                            <td>{flow.bitbucket_link}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <h3>API Gateways</h3>
            <Table striped bordered hover>
                <thead className="bg-primary text-white">
                    <tr>
                        <th>API Gateway Name</th>
                        <th>Route</th>
                        <th>Method</th>
                        <th>Authorization</th>
                        <th>Lambda Function</th>
                        <th>Owner</th>
                        <th>Scrum Team</th>
                        <th>API Type</th>
                    </tr>
                </thead>
                <tbody>
                    {item.api_gateway.map((api, index) => (
                        <tr key={index}>
                            <td>{api.api_gateway_name}</td>
                            <td>{api.route}</td>
                            <td>{api.method}</td>
                            <td>{api.authorization}</td>
                            <td>{api.lambda_function}</td>
                            <td>{api.owner}</td>
                            <td>{api.scrum_team}</td>
                            <td>{api.api_type}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}