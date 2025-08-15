export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("API key is not configured on the server.");
    }

    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

    const apiResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ message: "Error from Google API", details: errorText });
    }

    const data = await apiResponse.json();
    return response.status(200).json(data);

  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}