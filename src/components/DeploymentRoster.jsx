import { useState, useEffect } from "react";
import { Table, Container, Spinner, Alert, Button, Modal, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useNavigate, Outlet, useLocation } from 'react-router';
import { useOktaAuth } from '@okta/okta-react';
import { FaTrash, FaLock, FaUnlock, FaDownload } from 'react-icons/fa';
import { utils, writeFile } from 'xlsx';

export default function DeploymentRoster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ date: '', provider: 'aws', createdUser: '' });
    const navigate = useNavigate();
    const location = useLocation();

    const { authState, oktaAuth } = useOktaAuth();
    const [userName, setUserName] = useState('');
    const [userGroups, setUserGroups] = useState([]);

    useEffect(() => {
        if (authState && authState.isAuthenticated) {
            const userInfo = async () => {
                const user = await oktaAuth.getUser();
                setUserName(user.name);
                setUserGroups(user.groups || []);
                setFormData((prevData) => ({ ...prevData, createdUser: user.name }));
            };
            userInfo();
        }
    }, [authState, oktaAuth]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
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
    };

    const isDevOpsGroup = userGroups.includes('devops');

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const requestBody = {
            date: formData.date,
            provider: formData.provider,
            api_gateway: [],
            contact_flows: [],
            created_usr: formData.createdUser,
            dynamo_db_script: [],
            event_bridge: [],
            iam_role: [],
            locked_by: "",
            kds: [],
            lambda: [],
            last_updated_usr: [],
            lex: [],
            misc: [],
            s3: [],
            ui: []
        };

        try {
            const response = await fetch("https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error("Error:", error);
            setError(error.message);
        }
    };

    const handleDelete = async (date, provider) => {
        const requestBody = { date, provider };

        try {
            const response = await fetch("https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            fetchData();
        } catch (error) {
            console.error("Error:", error);
            setError(error.message);
        }
    };

    const handleLock = async (date, provider, isLocked) => {
        const requestBody = { date, provider, locked_by: isLocked ? null : userName };
        try {
            const response = await fetch("https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster/", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            fetchData();
        } catch (error) {
            console.error("Error:", error);
            setError(error.message);
        }
    };

    const handleDownload = async (date, provider) => {
        const url = `https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster/details?date=${date}&provider=${provider}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            const workbook = utils.book_new();

            const serviceNames = {
                api_gateway: 'API Gateway',
                contact_flows: 'Contact Flows',
                dynamo_db_script: 'DynamoDB Script',
                event_bridge: 'Event Bridge',
                iam_role: 'IAM Role',
                kds: 'KDS',
                lambda: 'Lambda',
                lex: 'Lex',
                misc: 'Misc',
                s3: 'S3',
                ui: 'UI'
            };
            Object.keys(serviceNames).forEach(service => {
                if (Array.isArray(data[service]) && data[service].length > 0) {
                    const worksheet = utils.json_to_sheet(data[service]);
                    utils.book_append_sheet(workbook, worksheet, serviceNames[service]);
                }
            });

            writeFile(workbook, `${date}_${provider}_details.xlsx`);
        } catch (error) {
            console.error("Error downloading the file:", error);
            setError(error.message);
        }
    };

    const handleRowClick = (item) => {
        const path = item.provider === 'gc' ? 'gc' : 'aws';
        navigate(`/deploymentroster/details/${path}/${item.date}/${item.provider}`);
    };

    const isDetailsPage = location.pathname.includes('/deploymentroster/details/');
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));


    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error: {error}</Alert>;
    }

    return (
        <>
            <Container fluid className="mt-4">
                {!isDetailsPage && (
                    <>
                        <h2>Deployment Roster</h2>
                        {isDevOpsGroup && (
                            <Button variant="primary" onClick={handleShowModal} className="my-3">
                                Create Deployment Roster
                            </Button>
                        )}
                        <Table responsive hover className="mt-3">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Date</th>
                                    <th>Cloud Provider</th>
                                    <th>Created User</th>
                                    <th>Last Updated User</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((item) => (
                                    <tr key={`${item.date}-${item.provider}`}>
                                        <td>
                                            <Button variant="link" onClick={() => handleRowClick(item)}>
                                                {item.date}
                                            </Button>
                                        </td>
                                        <td>{item.provider}</td>
                                        <td>{item.created_usr}</td>
                                        <td>{item.last_updated_usr}</td>
                                        <td>
                                            {isDevOpsGroup ? (
                                                <>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>{item.locked_by ? `Locked by: ${item.locked_by}` : 'Unlocked'}</Tooltip>}
                                                    >
                                                        <Button variant="link" onClick={() => handleLock(item.date, item.provider, !!item.locked_by)}>
                                                            {item.locked_by ? (
                                                                <FaLock style={{ fontSize: '1.2em', color: 'black' }} />
                                                            ) : (
                                                                <FaUnlock style={{ fontSize: '1.2em', color: 'black' }} />
                                                            )}
                                                        </Button>
                                                    </OverlayTrigger>
                                                    <Button variant="link" onClick={() => handleDelete(item.date, item.provider)}>
                                                        <FaTrash style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                    <Button variant="link" onClick={() => handleDownload(item.date, item.provider)}>
                                                        <FaDownload style={{ fontSize: '1.2em', color: 'black' }} />
                                                    </Button>
                                                </>
                                            ) : (
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip>Nope!</Tooltip>}
                                                >
                                                    <span className="d-inline-block">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>{item.locked_by ? `Locked by: ${item.locked_by}` : 'Unlocked'}</Tooltip>}
                                                        >
                                                            <Button variant="link" disabled style={{ pointerEvents: 'none' }}>
                                                                {item.locked_by ? (
                                                                    <FaLock style={{ fontSize: '1.2em', color: 'gray' }} />
                                                                ) : (
                                                                    <FaUnlock style={{ fontSize: '1.2em', color: 'gray' }} />
                                                                )}
                                                            </Button>
                                                        </OverlayTrigger>
                                                        <Button variant="link" disabled style={{ pointerEvents: 'none' }}>
                                                            <FaTrash style={{ fontSize: '1.2em', color: 'gray' }} />
                                                        </Button>
                                                        <Button variant="link" disabled style={{ pointerEvents: 'none' }}>
                                                            <FaDownload style={{ fontSize: '1.2em', color: 'gray' }} />
                                                        </Button>
                                                    </span>
                                                </OverlayTrigger>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
                <Outlet />
            </Container>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Deployment Roster</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formDate">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="formProvider" className="mt-3">
                            <Form.Label>Provider</Form.Label>
                            <Form.Control
                                as="select"
                                name="provider"
                                value={formData.provider}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="aws">AWS</option>
                                <option value="gc">GC</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formCreatedUser" className="mt-3">
                            <Form.Label>Created User</Form.Label>
                            <Form.Control
                                type="text"
                                name="createdUser"
                                value={formData.createdUser}
                                readOnly
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-center mt-3">
                            <Button variant="primary" type="submit">
                                Submit
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}