import { utils, writeFile } from 'xlsx';

export const deploymentHandleDownload = async (date, provider, setError) => {
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

        const headers = {
            lambda: [
                'function_name',
                'application',
                'owner',
                'scrum_team',
                'runtime',
                'role',
                'layers',
                'environment_variable',
                'region',
                'comments'
            ],
            api_gateway:[
                'api_gateway_name',
                'route',
                'method',
                'authorization',
                'lambda_function',
                'owner',
                'scrum_team',
                'api_type',
                'region'
            ],
            contact_flows: [
                'flow_name',
                'application',
                'owner',
                'scrum_team',
                'region',
                'comments'
            ],
            dynamo_db_script: [
                'script_path',
                'owner',
                'scrum_team',
                'region',
                'comments'
            ],
            ui: [
                'name',
                'application',
                'owner',
                'bitbucket_repo',
                'cloudfront_url',
                'scrum_team',
                'region',
                'comments'
            ],
            event_bridge :[
                'eb_name',
                'rule_name',
                'type',
                'event_pattern',
                'targets',
                'region'
            ],
            iam_role: [
                'name',
                'permissions',
                'owner',
                'application',
                'scrum_team',
                'region'
            ],
            kds: [
                'stream_name',
                'application',
                'owner',
                'region',
                'comments'
            ],
            s3: [
                'bucket_name',
                'application',
                'owner',
                'scrum_team',
                'notification',
                'life_cycle',
                'region',
                'comments'
            ],
            misc: [
                'item_name',
                'owner',
                'scrum_team',
                'details', 
                'region',
                'comments'
            ]
        };

        Object.keys(serviceNames).forEach(service => {
            if (Array.isArray(data[service]) && data[service].length > 0) {
                let worksheet;
                if (headers[service]) {
                    const orderedData = data[service].map(item => {
                        const orderedItem = {};
                        headers[service].forEach(header => {
                            orderedItem[header] = item[header];
                        });
                        return orderedItem;
                    });
                    worksheet = utils.json_to_sheet(orderedData);
                } else {
                    worksheet = utils.json_to_sheet(data[service]);
                }
                utils.book_append_sheet(workbook, worksheet, serviceNames[service]);
            }
        });

        writeFile(workbook, `${date}_${provider}_details.xlsx`);
    } catch (error) {
        console.error("Error downloading the file:", error);
        setError(error.message);
    }
};