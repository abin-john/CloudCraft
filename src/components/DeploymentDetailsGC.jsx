import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Tabs, Tab, Form, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from 'react-icons/fa';

export default function DeploymentDetailsGC() {
    const { provider, date } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRow, setEditingRow] = useState({ type: null, index: null });
    const [newEntry, setNewEntry] = useState({});
    const authState = { isAuthenticated: true }; // Replace with actual authentication state

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

    const handleChange = (e) => {
        setNewEntry({ ...newEntry, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // Implement save logic here
        setEditingRow({ type: null, index: null });
    };

    const handleEdit = (type, index) => {
        setEditingRow({ type, index });
        setNewEntry(data[type][index]);
    };

    const handleDelete = (type, index) => {
        // Implement delete logic here
    };

    const handleAddRow = (type) => {
        setEditingRow({ type, index: data[type].length });
        setNewEntry({});
    };

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            You need to be authenticated to edit or delete.
        </Tooltip>
    );

    if (loading) return <Spinner animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>;
    if (error) return <Alert variant="danger">Error: {error}</Alert>;
    if (!data) return <Container className="mt-4"><p>No details available.</p></Container>;

    return (
        <Container fluid className="mt-4">
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

            <Tabs defaultActiveKey="queues" id="deployment-details-tabs">
                <Tab eventKey="queues" title="Queues">
                    <Table responsive hover>
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>Name</th>
                                <th>Division</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.queues.map((queue, index) => (
                                <tr key={index}>
                                    {editingRow.type === 'queues' && editingRow.index === index ? (
                                        <>
                                            <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="Division" value={newEntry.Division || ''} onChange={handleChange} /></td>
                                            <td>
                                                <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{queue.name}</td>
                                            <td>{queue.Division}</td>
                                            <td>
                                                {authState.isAuthenticated ? (
                                                    <>
                                                        <Button variant="link" onClick={() => handleEdit('queues', index)}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        <Button variant="link" onClick={() => handleDelete('queues', index)}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    </>
                                                ) : (
                                                    <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                        <span className="d-inline-block">
                                                            <Button variant="link" onClick={() => handleEdit('queues', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            <Button variant="link" onClick={() => handleDelete('queues', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        </span>
                                                    </OverlayTrigger>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {editingRow.type === 'queues' && editingRow.index === data.queues.length && (
                                <tr>
                                    <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="Division" value={newEntry.Division || ''} onChange={handleChange} /></td>
                                    <td>
                                        <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {authState.isAuthenticated && (
                            <Button variant="link" onClick={() => handleAddRow('queues')}><FaPlus style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                        )}
                    </Table>
                </Tab>

                <Tab eventKey="data_tables" title="Data Tables">
                    <Table responsive hover>
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>Name</th>
                                <th>Division</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.DataTable.map((dataTable, index) => (
                                <tr key={index}>
                                    {editingRow.type === 'data_tables' && editingRow.index === index ? (
                                        <>
                                            <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                            <td><Form.Control type="text" name="Division" value={newEntry.Division || ''} onChange={handleChange} /></td>
                                            <td>
                                                <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{dataTable.name}</td>
                                            <td>{dataTable.Division}</td>
                                            <td>
                                                {authState.isAuthenticated ? (
                                                    <>
                                                        <Button variant="link" onClick={() => handleEdit('data_tables', index)}><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        <Button variant="link" onClick={() => handleDelete('data_tables', index)}><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                    </>
                                                ) : (
                                                    <OverlayTrigger placement="top" overlay={renderTooltip}>
                                                        <span className="d-inline-block">
                                                            <Button variant="link" onClick={() => handleEdit('data_tables', index)} disabled><FaEdit style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                            <Button variant="link" onClick={() => handleDelete('data_tables', index)} disabled><FaTrash style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                                        </span>
                                                    </OverlayTrigger>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {editingRow.type === 'data_tables' && editingRow.index === data.DataTable.length && (
                                <tr>
                                    <td><Form.Control type="text" name="name" value={newEntry.name || ''} onChange={handleChange} /></td>
                                    <td><Form.Control type="text" name="Division" value={newEntry.Division || ''} onChange={handleChange} /></td>
                                    <td>
                                        <Button variant="link" onClick={handleSave}><FaSave style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                        <Button variant="link" onClick={() => setEditingRow({ type: null, index: null })}><FaTimes style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {authState.isAuthenticated && (
                            <Button variant="link" onClick={() => handleAddRow('data_tables')}><FaPlus style={{ fontSize: '1.2em', color: 'black' }} /></Button>
                        )}
                    </Table>
                </Tab>
            </Tabs>
        </Container>
    );
}