// Vercel Serverless Function: RDB_지점좌표 (GID 211834294)
export default async function handler(req, res) {
    const googleBranchCsvUrl = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=211834294";
    
    try {
        const response = await fetch(googleBranchCsvUrl, {
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
        console.error('Vercel API Branch Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch branch data from Google Sheets' });
    }
}
