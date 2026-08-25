// Vercel Serverless Function: RDB_대학주소 (GID 541959206)
export default async function handler(req, res) {
    const googleUniversityCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=541959206";

    try {
        const response = await fetch(googleUniversityCsvUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`Google Sheets HTTP status ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (csvText.trim().startsWith('<!DOCTYPE html') || csvText.includes('<html')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(401).json({ 
                error: 'Google Sheet access denied. Google Sheets에서 "웹에 게시(Publish to web)" 설정을 확인해주세요.' 
            });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.status(200).send(csvText);
    } catch (error) {
        console.error('Vercel API University Data Fetch Error:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({ error: 'Failed to fetch university data from Google Sheets' });
    }
}
