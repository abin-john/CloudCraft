import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { BsPlus } from 'react-icons/bs';
import { useOktaAuth } from '@okta/okta-react';

export default function DeploymentDetailsAWS() {
    const { provider, date } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalFields, setModalFields] = useState([]);
    const [newEntry, setNewEntry] = useState({});
    const [currentService, setCurrentService] = useState('');
    const [editIndex, setEditIndex] = useState(null);

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
        setEditIndex(index);
        setNewEntry(data[type][index]);
        setModalTitle(`Edit ${type.replace('_', ' ')}`);
        setModalFields(Object.keys(data[type][index]).map(key => key.replace(/_/g, ' ')));
        setShowModal(true);
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
        let fields = [];
        switch (type) {
            case 'lambda':
                fields = ['Function Name', 'Application', 'Owner', 'Scrum Team', 'Runtime', 'Role', 'Layers', 'Environment Variable', 'Comments'];
                break;
            case 'contact_flows':
                fields = ['Name', 'Type', 'New', 'Bitbucket Link'];
                break;
            case 'api_gateway':
                fields = ['API Gateway Name', 'Route', 'Method', 'Authorization', 'Lambda Function', 'Owner', 'Scrum Team', 'API Type'];
                break;
            default:
                break;
        }
        setModalTitle(`Add ${type.replace('_', ' ')}`);
        setModalFields(fields);
        setNewEntry({});
        setCurrentService(type);
        setEditIndex(null);
        setShowModal(true);
    };

    const handleSave = () => {
        const postData = modalFields.reduce((acc, field) => {
            const key = field.toLowerCase().replace(/ /g, '_');
            acc[key] = newEntry[key] || '';
            return acc;
        }, {});

        postData.userName = userName;

        if (editIndex === null) {
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
                    setShowModal(false);
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
            postData.id = data[currentService][editIndex].id;

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
                    setShowModal(false);
                    setNewEntry({});
                    // Optionally, refresh the data to show the edited entry and update last_updated_usr
                    setData(prevData => {
                        const updatedService = [...prevData[currentService]];
                        updatedService[editIndex] = postData;
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
                                    <td>{lambda.function_name}</td>
                                    <td>{lambda.application}</td>
                                    <td>{lambda.owner}</td>
                                    <td>{lambda.scrum_team}</td>
                                    <td>{lambda.role}</td>
                                    <td>{lambda.runtime}</td>
                                    <td>{lambda.layers}</td>
                                    <td>{lambda.environment_variable}</td>
                                    <td>{lambda.comments}</td>
                                    <td>
                                        {authState.isAuthenticated ? (
                                            <>
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleEdit('lambda', index)}
                                                >
                                                    <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleDelete('lambda', index)}
                                                >
                                                    <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                            </>
                                        ) : (
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={renderTooltip}
                                            >
                                                <span className="d-inline-block">
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleEdit('lambda', index)}
                                                        disabled
                                                    >
                                                        <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleDelete('lambda', index)}
                                                        disabled
                                                    >
                                                        <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {authState.isAuthenticated ? (
                            <Button
                                variant="link"
                                onClick={() => handleAddRow('contact_flows')}
                            >
                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                            </Button>
                        ) : (
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip}
                            >
                                <span className="d-inline-block">
                                    <Button
                                        variant="dark"
                                        onClick={() => handleAddRow('contact_flows')}
                                        disabled
                                    >
                                        <BsPlus style={{ fontSize: '1.3em', fontWeight: 'bold', color: 'white' }} />
                                    </Button>
                                </span>
                            </OverlayTrigger>
                        )}
                    </Table>
                </Container>

                <Container fluid className="mt-4">
                    <h4>Contact Flows</h4>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>New</th>
                                <th>Bitbucket Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.contact_flows.map((flow, index) => (
                                <tr key={index}>
                                    <td>{flow.name}</td>
                                    <td>{flow.type}</td>
                                    <td>{flow.new}</td>
                                    <td>{flow.bitbucket_link}</td>
                                    <td>
                                        {authState.isAuthenticated ? (
                                            <>
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleEdit('contact_flows', index)}
                                                >
                                                    <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleDelete('contact_flows', index)}
                                                >
                                                    <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                            </>
                                        ) : (
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={renderTooltip}
                                            >
                                                <span className="d-inline-block">
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleEdit('contact_flows', index)}
                                                        disabled
                                                    >
                                                        <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleDelete('contact_flows', index)}
                                                        disabled
                                                    >
                                                        <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {authState.isAuthenticated ? (
                            <Button
                                variant="link"
                                onClick={() => handleAddRow('contact_flows')}
                            >
                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                            </Button>
                        ) : (
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip}
                            >
                                <span className="d-inline-block">
                                    <Button
                                        variant="dark"
                                        onClick={() => handleAddRow('contact_flows')}
                                        disabled
                                    >
                                        <BsPlus style={{ fontSize: '1.3em', fontWeight: 'bold', color: 'white' }} />
                                    </Button>
                                </span>
                            </OverlayTrigger>
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
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleEdit('api_gateway', index)}
                                                >
                                                    <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => handleDelete('api_gateway', index)}
                                                >
                                                    <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                </Button>
                                            </>
                                        ) : (
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={renderTooltip}
                                            >
                                                <span className="d-inline-block">
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleEdit('api_gateway', index)}
                                                        disabled
                                                    >
                                                        <FaEdit style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleDelete('contact_flows', index)}
                                                        disabled
                                                    >
                                                        <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {authState.isAuthenticated ? (
                            <Button
                                variant="link"
                                onClick={() => handleAddRow('api_gateway')}
                            >
                                <FaPlus style={{ fontSize: '1.2em', color: 'black' }} />
                            </Button>
                        ) : (
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip}
                            >
                                <span className="d-inline-block">
                                    <Button
                                        variant="dark"
                                        onClick={() => handleAddRow('api_gateway')}
                                        disabled
                                    >
                                        <BsPlus style={{ fontSize: '1.3em', fontWeight: 'bold', color: 'white' }} />
                                    </Button>
                                </span>
                            </OverlayTrigger>
                        )}
                    </Table>
                </Container>

                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{modalTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            {modalFields.map((field, index) => (
                                <Form.Group controlId={`form${field.replace(' ', '')}`} key={index}>
                                    <Form.Label>{field}</Form.Label>
                                    <Form.Control
                                        as={field === 'Environment Variable' || field === 'Comments' ? 'textarea' : 'input'}
                                        rows={field === 'Environment Variable' || field === 'Comments' ? 3 : undefined}
                                        name={field.toLowerCase().replace(/ /g, '_')}
                                        value={newEntry[field.toLowerCase().replace(/ /g, '_')] || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            ))}
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </>
    );
}