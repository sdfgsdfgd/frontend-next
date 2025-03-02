import {NextApiRequest, NextApiResponse} from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const headers: HeadersInit = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers.append(key, value);
            }
        });
        headers.set('Content-Type', 'application/json');

        const response = await fetch('sdfgsdfg.net/test', {
            method: req.method,
            headers: headers,
            body: req.body ? JSON.stringify(req.body) : undefined,
        });

        if (!response.ok) {
            return res.status(response.status).json({message: 'Error fetching data'});
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({message: 'Internal Server Error', error: (error as Error).message});
    }
}