import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
        const postData = { ...newEntry, userName };

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
            Please log in to perform this action.
        </Tooltip>
    );

    return (
        <>
            <Container fluid className="mt-4">
                <Container fluid className="mt-4">
                    <h2>Deployment Details (AWS)</h2>
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
                        </tbody>
                    </Table>
                </Container>

                <Container fluid className="mt-4">
                    <h3>Lambda Functions</h3>
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
                                <th>Comments</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lambda.map((lambda, index) => (
                                <tr key={index}>
                                    {editingRow.type === 'lambda' && editingRow.index === index ? (
                                        <>
                                            <td><Form.Control type="text" name="function_name" value={newEntry.function_name || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="application" value={newEntry.application || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="runtime" value={newEntry.runtime || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="role" value={newEntry.role || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="layers" value={newEntry.layers || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="environment_variable" value={newEntry.environment_variable || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                            <td>
                                                <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
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
                                            <td>{lambda.environment_variable}</td>
                                            <td>{lambda.comments}</td>
                                            <td>
                                                {authState.isAuthenticated ? (
                                                    <>
                                                        <Button variant="link" onClick={() => handleEdit('lambda', index)}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        <Button variant="link" onClick={() => handleDelete('lambda', index)}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
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
                                    <td><Form.Control type="text" name="function_name" value={newEntry.function_name || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="application" value={newEntry.application || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="runtime" value={newEntry.runtime || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="role" value={newEntry.role || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="layers" value={newEntry.layers || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="environment_variable" value={newEntry.environment_variable || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                    <td>
                                        <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {authState.isAuthenticated && (
                            <Button variant="link" onClick={() => handleAddRow('lambda')}><FaPlus style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                        )}
                    </Table>
                </Container>

                <Container fluid className="mt-4">
                    <h3>Contact Flows</h3>
                    <Table responsive hover>
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>Flow Name</th>
                                <th>Application</th>
                                <th>Owner</th>
                                <th>Scrum Team</th>
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
                                            <td><Form.Control type="text" name="application" value={newEntry.application || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                            <td>
                                                <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{flow.flow_name}</td>
                                            <td>{flow.application}</td>
                                            <td>{flow.owner}</td>
                                            <td>{flow.scrum_team}</td>
                                            <td>{flow.comments}</td>
                                            <td>
                                                {authState.isAuthenticated ? (
                                                    <>
                                                        <Button variant="link" onClick={() => handleEdit('contact_flows', index)}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        <Button variant="link" onClick={() => handleDelete('contact_flows', index)}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
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
                                    <td><Form.Control type="text" name="application" value={newEntry.application || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="comments" value={newEntry.comments || ''} onChange={handleChange} /></td>
                                    <td>
                                        <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {authState.isAuthenticated && (
                            <Button variant="link" onClick={() => handleAddRow('contact_flows')}><FaPlus style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                        )}
                    </Table>
                </Container>

                <Container fluid className="mt-4">
                    <h3>API Gateway</h3>
                    <Table responsive hover>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.api_gateway.map((api, index) => (
                                <tr key={index}>
                                    {editingRow.type === 'api_gateway' && editingRow.index === index ? (
                                        <>
                                            <td><Form.Control type="text" name="api_gateway_name" value={newEntry.api_gateway_name || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="route" value={newEntry.route || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="method" value={newEntry.method || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="authorization" value={newEntry.authorization || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="lambda_function" value={newEntry.lambda_function || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="api_type" value={newEntry.api_type || ''} onChange={handleChange} /></td>
                                            <td>
                                                <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{api.api_gateway_name}</td>
                                            <td>{api.route}</td>
                                            <td>{api.method}</td>
                                            <td>{api.authorization}</td>
                                            <td>{api.lambda_function}</td>
                                            <td>{api.owner}</td>
                                            <td>{api.scrum_team}</td>
                                            <td>{api.api_type}</td>
                                            <td>
                                                {authState.isAuthenticated ? (
                                                    <>
                                                        <Button variant="link" onClick={() => handleEdit('api_gateway', index)}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        <Button variant="link" onClick={() => handleDelete('api_gateway', index)}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
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
                                    <td><Form.Control type="text" name="route" value={newEntry.route || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="method" value={newEntry.method || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="authorization" value={newEntry.authorization || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="lambda_function" value={newEntry.lambda_function || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="owner" value={newEntry.owner || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="scrum_team" value={newEntry.scrum_team || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="api_type" value={newEntry.api_type || ''} onChange={handleChange} /></td>
                                    <td>
                                        <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        <Button variant="link" onClick={() => setEditingRow(null)}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {authState.isAuthenticated && (
                            <Button variant="link" onClick={() => handleAddRow('api_gateway')}><FaPlus style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                        )}
                    </Table>
                </Container>
            </Container>
        </>
    );
}