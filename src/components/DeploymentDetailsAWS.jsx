import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Spinner, Alert, OverlayTrigger, Tooltip, Tab, Tabs, Card, Col, Row, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { useOktaAuth } from '@okta/okta-react';

export default function DeploymentDetailsAWS() {
    const { provider, date } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRow, setEditingRow] = useState({ type: null, index: null });
    const [newEntry, setNewEntry] = useState({});
    const [currentService, setCurrentService] = useState('');

    // Okta Auth Code - Need to refactor this later to be called from App.jsx
    const { authState } = useOktaAuth();
    const userName = authState.isAuthenticated ? authState.idToken.claims.name : '';

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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    )
    if (error) return <Alert variant="danger">Error: {error}</Alert>;
    if (!data) return <Container className="mt-4"><p>No details available.</p></Container>;

    const handleEdit = (type, index) => {
        setCurrentService(type);
        setEditingRow({ type, index });
        setNewEntry(data[type][index]);
    };

    const handleDelete = (type, index) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this item?");
        if (!isConfirmed) {
            return;
        }

        const itemToDelete = { ...data[type][index], userName };

        fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${type}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemToDelete)
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((responseData) => {
                console.log('Success:', responseData);
                // Update the state to remove the deleted item and update last_updated_usr
                setData(prevData => ({
                    ...prevData,
                    [type]: prevData[type].filter((_, i) => i !== index),
                    last_updated_usr: userName
                }));
            })
            .catch((error) => {
                setError(error.message);
            });
    };

    const handleAddRow = (type) => {
        setCurrentService(type);
        setEditingRow({ type, index: data[type].length });
        setNewEntry({});
    };

    const handleSave = () => {
        if (!newEntry.application) {
            alert('Application name is required');
            return;
        }
        const postData = {
            ...newEntry,
            owner: newEntry.owner || userName, // Ensure owner defaults to userName if empty
            region: newEntry.region || 'us-east-1', // Ensure region defaults to 'us-east-1' if empty
            userName
        };

        if (editingRow.index === data[currentService].length) {
            // Add new entry
            postData.id = data[currentService].length + 1;

            fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${currentService}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Success:', data);
                    setEditingRow({ type: null, index: null });
                    setNewEntry({});
                    // Optionally, refresh the data to show the new entry and update last_updated_usr
                    setData(prevData => ({
                        ...prevData,
                        [currentService]: [...prevData[currentService], postData],
                        last_updated_usr: userName
                    }));
                })
                .catch((error) => {
                    setError(error.message);
                });
        } else {
            // Edit existing entry
            postData.id = data[currentService][editingRow.index].id;

            fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${currentService}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Success:', data);
                    setEditingRow({ type: null, index: null });
                    setNewEntry({});
                    // Optionally, refresh the data to show the edited entry and update last_updated_usr
                    setData(prevData => {
                        const updatedService = [...prevData[currentService]];
                        updatedService[editingRow.index] = postData;
                        return {
                            ...prevData,
                            [currentService]: updatedService,
                            last_updated_usr: userName
                        };
                    });
                })
                .catch((error) => {
                    setError(error.message);
                });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEntry(prevState => ({
            ...prevState,
            [name]: value
        }));
    };



    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {authState.isAuthenticated ? (isLocked ? 'You ran out of time!' : 'Click!') : 'Please log in to perform this action.'}
        </Tooltip>
    );
    const isLocked = !!data.locked_by;

    return (
        <>
            <Container fluid className="mt-4">
                <h3>AWS Deployment Request : {data.date} </h3>
                <Card>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Card.Text><strong>Created User:</strong> {data.created_usr}</Card.Text>
                            </Col>
                            <Col md={6}>
                                <strong>Locked By:</strong> {data.locked_by ? <Badge bg="danger">{data.locked_by}</Badge> : 'Unlocked'}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>

            <Container fluid className="mt-4">
                <Tabs defaultActiveKey="lambda" id="deployment-details-tabs">
                    <Tab eventKey="lambda" title="Lambda Functions">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Function Name</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Scrum Team</th>
                                    <th>Runtime</th>
                                    <th>Role</th>
                                    <th>Layers</th>
                                    <th>Environment Variable</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.lambda.map((lambda, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'lambda' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="function_name" value={newEntry.function_name || ''} onChange={handleChange} placeholder="Function Name" /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="runtime" value={newEntry.runtime || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="role" value={newEntry.role || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="layers" value={newEntry.layers || ''} onChange={handleChange} /></td>
                                                <td><Form.Control as="textarea" name="environment_variable" value={newEntry.environment_variable || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{lambda.function_name}</td>
                                                <td>{lambda.application}</td>
                                                <td>{lambda.owner}</td>
                                                <td>{lambda.scrum_team}</td>
                                                <td>{lambda.runtime}</td>
                                                <td>{lambda.role}</td>
                                                <td>{lambda.layers}</td>
                                                <td style={{ whiteSpace: 'pre-wrap' }}>{lambda.environment_variable}</td>
                                                <td>{lambda.region}</td>
                                                <td>{lambda.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('lambda', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('lambda', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('lambda', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('lambda', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'lambda' && editingRow.index === data.lambda.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="function_name" value={newEntry.function_name || ''} onChange={handleChange} placeholder="Enter Function Name" /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="runtime" value={newEntry.runtime || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="role" value={newEntry.role || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="layers" value={newEntry.layers || ''} onChange={handleChange} /></td>
                                        <td><Form.Control as="textarea" name="environment_variable" value={newEntry.environment_variable || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button
                                                variant="link"
                                                onClick={() => handleAddRow('lambda')}
                                                disabled={isLocked}
                                                style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>

                    <Tab eventKey="contact_flows" title="Contact Flows">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Flow Name</th>
                                    <th>Type</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Scrum Team</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.contact_flows.map((flow, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'contact_flows' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="flow_name" value={newEntry.flow_name || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="flow_type" value={newEntry.flow_type || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{flow.flow_name}</td>
                                                <td>{flow.flow_type}</td>
                                                <td>{flow.application}</td>
                                                <td>{flow.owner}</td>
                                                <td>{flow.scrum_team}</td>
                                                <td>{flow.region}</td>
                                                <td>{flow.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('contact_flows', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('contact_flows', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('contact_flows', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('contact_flows', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'contact_flows' && editingRow.index === data.contact_flows.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="flow_name" value={newEntry.flow_name || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="flow_type" value={newEntry.flow_type || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('contact_flows')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>

                            )}
                        </Table>
                    </Tab>

                    <Tab eventKey="api_gateway" title="API Gateway">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>API Gateway Name</th>
                                    <th>Application</th>
                                    <th>Route</th>
                                    <th>Method</th>
                                    <th>Authorization</th>
                                    <th>Lambda Function</th>
                                    <th>Owner</th>
                                    <th>Scrum Team</th>
                                    <th>API Type</th>
                                    <th>Region</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.api_gateway.map((api, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'api_gateway' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="api_gateway_name" value={newEntry.api_gateway_name || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="route" value={newEntry.route || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="method" value={newEntry.method || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="authorization" value={newEntry.authorization || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="lambda_function" value={newEntry.lambda_function || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="api_type" value={newEntry.api_type || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{api.api_gateway_name}</td>
                                                <td>{api.application}</td>
                                                <td>{api.route}</td>
                                                <td>{api.method}</td>
                                                <td>{api.authorization}</td>
                                                <td>{api.lambda_function}</td>
                                                <td>{api.owner}</td>
                                                <td>{api.scrum_team}</td>
                                                <td>{api.api_type}</td>
                                                <td>{api.region}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('api_gateway', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('api_gateway', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('api_gateway', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('api_gateway', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'api_gateway' && editingRow.index === data.api_gateway.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="api_gateway_name" value={newEntry.api_gateway_name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="route" value={newEntry.route || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="method" value={newEntry.method || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="authorization" value={newEntry.authorization || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="lambda_function" value={newEntry.lambda_function || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="api_type" value={newEntry.api_type || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('api_gateway')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab >
                    <Tab eventKey="dynamo_db_script" title="Dynamo DB Entries">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Table Name</th>
                                    <th>Script Path</th>
                                    <th>Application</th>
                                    <th>Scrum Team</th>
                                    <th>Owner</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.dynamo_db_script.map((entry, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'dynamo_db_script' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="script_path" value={newEntry.script_path || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{entry.name}</td>
                                                <td>{entry.script_path}</td>
                                                <td>{entry.application}</td>
                                                <td>{entry.scrum_team}</td>
                                                <td>{entry.owner}</td>
                                                <td>{entry.region}</td>
                                                <td>{entry.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('dynamo_db_script', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('dynamo_db_script', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('dynamo_db_script', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('dynamo_db_script', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'dynamo_db_script' && editingRow.index === data.dynamo_db_script.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="script_path" value={newEntry.script_path || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('dynamo_db_script')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="ui" title="UI">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Name</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Bitbucket Repo</th>
                                    <th>Branch</th>
                                    <th>CloudFront URL</th>
                                    <th>Scrum Team</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.ui.map((ui, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'ui' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>

                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="bitbucket_repo" value={newEntry.bitbucket_repo || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="branch" value={newEntry.branch || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="cloudfront_url" value={newEntry.cloudfront_url || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{ui.name}</td>
                                                <td>{ui.application}</td>
                                                <td>{ui.owner}</td>
                                                <td>{ui.bitbucket_repo}</td>
                                                <td>{ui.branch}</td>
                                                <td>{ui.cloudfront_url}</td>
                                                <td>{ui.scrum_team}</td>
                                                <td>{ui.region}</td>
                                                <td>{ui.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('ui', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('ui', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('ui', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('ui', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'ui' && editingRow.index === data.ui.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="bitbucket_repo" value={newEntry.bitbucket_repo || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="branch" value={newEntry.branch || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="cloudfront_url" value={newEntry.cloudfront_url || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('ui')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="event_bridge" title="Event Bridge">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>EB Name (Bus)</th>
                                    <th>Application</th>
                                    <th>Rule Name</th>
                                    <th>Type</th>
                                    <th>Event Pattern</th>
                                    <th>Targets</th>
                                    <th>Region</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.event_bridge.map((eb, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'event_bridge' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="eb_name" value={newEntry.eb_name || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="rule_name" value={newEntry.rule_name || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="type" value={newEntry.type || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="event_pattern" value={newEntry.event_pattern || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="targets" value={newEntry.targets || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{eb.eb_name}</td>
                                                <td>{eb.application}</td>
                                                <td>{eb.rule_name}</td>
                                                <td>{eb.type}</td>
                                                <td>{eb.event_pattern}</td>
                                                <td>{eb.targets}</td>
                                                <td>{eb.region}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('event_bridge', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('event_bridge', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('event_bridge', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('event_bridge', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'event_bridge' && editingRow.index === data.event_bridge.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="eb_name" value={newEntry.eb_name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="rule_name" value={newEntry.rule_name || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="type" value={newEntry.type || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="event_pattern" value={newEntry.event_pattern || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="targets" value={newEntry.targets || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('event_bridge')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="iam_role" title="IAM Role">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Name</th>
                                    <th>Permissions</th>
                                    <th>Owner</th>
                                    <th>Application</th>
                                    <th>Scrum Team</th>
                                    <th>Region</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.iam_role.map((role, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'iam_role' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="permissions" value={newEntry.permissions || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{role.name}</td>
                                                <td>{role.permissions}</td>
                                                <td>{role.owner}</td>
                                                <td>{role.application}</td>
                                                <td>{role.scrum_team}</td>
                                                <td>{role.region}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('iam_role', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('iam_role', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('iam_role', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('iam_role', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'iam_role' && editingRow.index === data.iam_role.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="permissions" value={newEntry.permissions || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('iam_role')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="kds" title="KDS">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Stream Name</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.kds.map((stream, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'kds' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="stream_name" value={newEntry.stream_name || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{stream.stream_name}</td>
                                                <td>{stream.application}</td>
                                                <td>{stream.owner}</td>
                                                <td>{stream.region}</td>
                                                <td>{stream.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('kds', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('kds', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('kds', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('kds', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'kds' && editingRow.index === data.kds.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="stream_name" value={newEntry.stream_name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('kds')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="s3" title="S3">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Bucket Name</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Scrum Team</th>
                                    <th>Notifications</th>
                                    <th>Life Cycle</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.s3.map((bucket, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 's3' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="bucket_name" value={newEntry.bucket_name || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="notifications" value={newEntry.notifications || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="life_cycle" value={newEntry.life_cycle || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{bucket.bucket_name}</td>
                                                <td>{bucket.application}</td>
                                                <td>{bucket.owner}</td>
                                                <td>{bucket.scrum_team}</td>
                                                <td>{bucket.notifications}</td>
                                                <td>{bucket.life_cycle}</td>
                                                <td>{bucket.region}</td>
                                                <td>{bucket.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('s3', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('s3', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('s3', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('s3', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 's3' && editingRow.index === data.s3.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="bucket_name" value={newEntry.bucket_name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="notifications" value={newEntry.notifications || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="life_cycle" value={newEntry.life_cycle || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('s3')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                    <Tab eventKey="misc" title="Miscellaneous">
                        <Table responsive hover>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Item Name</th>
                                    <th>Application</th>
                                    <th>Owner</th>
                                    <th>Scrum Team</th>
                                    <th>Details</th>
                                    <th>Region</th>
                                    <th>Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.misc.map((item, index) => (
                                    <tr key={index}>
                                        {editingRow.type === 'misc' && editingRow.index === index ? (
                                            <>
                                                <td><Form.Control type="text" name="item_name" value={newEntry.item_name || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                        <option value="">Select Application</option>
                                                        <option value="Telesales">Telesales</option>
                                                        <option value="Clinical">Clinical</option>
                                                        <option value="GC ELV">GC ELV</option>
                                                        <option value="GC Carelon">GC Carelon</option>
                                                        <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                        <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                        <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                        <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                        <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                        <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                                <td><Form.Control type="text" name="details" value={newEntry.details || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                        <option value="us-east-1">us-east-1</option>
                                                        <option value="us-west-2">us-west-2</option>
                                                    </Form.Control>
                                                </td>
                                                <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                                <td>
                                                    <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{item.item_name}</td>
                                                <td>{item.application}</td>
                                                <td>{item.owner}</td>
                                                <td>{item.scrum_team}</td>
                                                <td>{item.details}</td>
                                                <td>{item.region}</td>
                                                <td>{item.comments}</td>
                                                <td>
                                                    {authState.isAuthenticated ? (
                                                        <>
                                                            <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                                <span className="d-inline-block">
                                                                    <Button variant="link" onClick={() => handleEdit('s3', index)} disabled={isLocked}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                    <Button variant="link" onClick={() => handleDelete('s3', index)} disabled={isLocked}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                            <span className="d-inline-block">
                                                                <Button variant="link" onClick={() => handleEdit('s3', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                                <Button variant="link" onClick={() => handleDelete('s3', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {editingRow.type === 'misc' && editingRow.index === data.misc.length && (
                                    <tr>
                                        <td><Form.Control type="text" name="item_name" value={newEntry.item_name || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="application" value={newEntry.application || ''} onChange={handleChange}>
                                                <option value="">Select Application</option>
                                                <option value="Telesales">Telesales</option>
                                                <option value="Clinical">Clinical</option>
                                                <option value="GC ELV">GC ELV</option>
                                                <option value="GC Carelon">GC Carelon</option>
                                                <option value="CCVR Blue ELV - DVA">CCVR Blue ELV - DVA</option>
                                                <option value="CCVR Green ELV - DVA">CCVR Green ELV - DVA</option>
                                                <option value="CCVR Blue ELV">CCVR Blue ELV</option>
                                                <option value="CCVR Green ELV">CCVR Green ELV</option>
                                                <option value="CCVR Blue Carelon">CCVR Blue Carelon</option>
                                                <option value="CCVR Green Carelon">CCVR Green Carelon</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="owner" value={newEntry.owner || userName} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                        <td><Form.Control type="text" name="details" value={newEntry.details || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Form.Control as="select" name="region" value={newEntry.region || 'us-east-1'} onChange={handleChange}>
                                                <option value="us-east-1">us-east-1</option>
                                                <option value="us-west-2">us-west-2</option>
                                            </Form.Control>
                                        </td>
                                        <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                        <td>
                                            <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {authState.isAuthenticated && (
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <div className="d-inline-block" style={{ position: 'relative' }}>
                                        <span style={{ display: 'inline-block', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                            <Button variant="link" onClick={() => handleAddRow('misc')} disabled={isLocked} style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                                            >
                                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                                            </Button>
                                        </span>
                                    </div>
                                </OverlayTrigger>
                            )}
                        </Table>
                    </Tab>
                </Tabs >
            </Container >
        </>
    );
}