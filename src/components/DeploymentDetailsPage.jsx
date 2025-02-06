import { useLocation } from 'react-router';
import { Container, Card, ListGroup } from 'react-bootstrap';

export default function DeploymentDetailsPage() {
    const location = useLocation();
    const { item } = location.state || {};

    if (!item) {
        return <Container className="mt-4"><p>No details available.</p></Container>;
    }

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header>Deployment Details</Card.Header>
                <Card.Body>
                    <Card.Title>{item.date}</Card.Title>
                    <Card.Text>
                        <strong>Cloud Provider:</strong> {item.provider}<br />
                        <strong>Created User:</strong> {item.created_usr}<br />
                        <strong>Last Updated User:</strong> {item.last_updated_usr}<br />
                    </Card.Text>
                    <Card.Text>
                        <strong>Lambda Functions:</strong>
                        <ListGroup>
                            {item.lambda.map((lambda, index) => (
                                <ListGroup.Item key={index}>
                                    <strong>App:</strong> {lambda.app}<br />
                                    <strong>Owner:</strong> {lambda.owner}<br />
                                    <strong>Additional Configs:</strong> {lambda.additional_configs}<br />
                                    <strong>Function Name:</strong> {lambda.function_name}<br />
                                    <strong>Scrum Team:</strong> {lambda.scrum_team}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Text>
                    <Card.Text>
                        <strong>Contact Flows:</strong>
                        <ListGroup>
                            {item.contact_flows.map((flow, index) => (
                                <ListGroup.Item key={index}>
                                    <strong>Name:</strong> {flow.name}<br />
                                    <strong>Type:</strong> {flow.type}<br />
                                    <strong>New:</strong> {flow.new}<br />
                                    <strong>Bitbucket Link:</strong> {flow.bitbucket_link}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Text>
                    <Card.Text>
                        <strong>API Gateways:</strong>
                        <ListGroup>
                            {item.api_gateway.map((api, index) => (
                                <ListGroup.Item key={index}>
                                    <strong>API Gateway Name:</strong> {api.api_gateway_name}<br />
                                    <strong>Route:</strong> {api.route}<br />
                                    <strong>Method:</strong> {api.method}<br />
                                    <strong>Authorization:</strong> {api.authorization}<br />
                                    <strong>Lambda Function:</strong> {api.lambda_function}<br />
                                    <strong>Owner:</strong> {api.owner}<br />
                                    <strong>Scrum Team:</strong> {api.scrum_team}<br />
                                    <strong>API Type:</strong> {api.api_type}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
}