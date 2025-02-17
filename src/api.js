export const fetchData = async (date, provider) => {
    const response = await fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster/details?date=${date}&provider=${provider}`);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};

export const saveData = async (date, provider, service, data) => {
    const response = await fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${service}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};

export const updateData = async (date, provider, service, data) => {
    const response = await fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${service}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};

export const deleteData = async (date, provider, service, data) => {
    const response = await fetch(`https://62xa9k0qje.execute-api.us-east-1.amazonaws.com/dev/deploymentroster?date=${date}&provider=${provider}&service=${service}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};