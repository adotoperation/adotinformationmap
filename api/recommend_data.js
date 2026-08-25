// Vercel Serverless Function: RDB_추천입지
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // If a Google Sheet GID is configured for RDB_추천입지, fetch it from Google Sheets
    const googleRecommendCsvUrl = process.env.GOOGLE_RECOMMEND_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=777777777";

    try {
        const response = await fetch(googleRecommendCsvUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            redirect: 'follow'
        });
        
        if (response.ok) {
            const csvText = await response.text();
            if (!csvText.trim().startsWith('<!DOCTYPE html') && !csvText.includes('<html')) {
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
                return res.status(200).send(csvText);
            }
        }
    } catch (error) {
        console.warn('Google Sheets Recommend Data Fetch Warning, falling back to RDB_추천입지.csv:', error);
    }

    // Fallback: Read local RDB_추천입지.csv
    try {
        const localCsvPath = path.join(process.cwd(), 'RDB_추천입지.csv');
        if (fs.existsSync(localCsvPath)) {
            const localCsv = fs.readFileSync(localCsvPath, 'utf-8');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).send(localCsv);
        }
    } catch (e) {
        console.error('Failed to read local RDB_추천입지.csv:', e);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Failed to fetch recommendation data' });
}
