// This is an example of a Next.js API route that acts as a proxy.
export default async function handler(req, res) {
    const response = await fetch('sdfgsdfg.net/api/test', {
        method: req.method,
        headers: {
            // Forward the headers from the original request
            ...req.headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    });

    if (!response.ok) {
        // Handle any errors from your backend API
        return res.status(response.status).json({ message: 'Error fetching data' });
    }

    const data = await response.json();
    res.status(200).json(data);
}
