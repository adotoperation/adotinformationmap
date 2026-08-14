// Vercel Serverless Function: RDB_당년학교정보 (GID 630627369)
export default async function handler(req, res) {
    const googleSchoolCsvUrl = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/pub?output=csv&gid=630627369";
    
    try {
        const response = await fetch(googleSchoolCsvUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Google Sheets HTTP status ${response.status}`);
        }
        
        const csvText = await response.text();
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.status(200).send(csvText);
    } catch (error) {
        console.error('Vercel API School Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch school data from Google Sheets' });
    }
}
