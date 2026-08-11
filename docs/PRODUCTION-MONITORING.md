# Production Monitoring Strategy

SynergyBridge's V1 monitoring relies on native integrations provided by Vercel and Firebase rather than introducing heavy third-party dependencies immediately.

## 1. Application Error Monitoring
**Tool**: Vercel Serverless Logs
- Vercel automatically captures `console.error` and `console.warn` outputs from Next.js serverless API routes.
- **Action**: Use Vercel's Log Drain feature to push structured JSON logs to a secure external bucket if long-term retention is required.
- **Rule**: Never log `decodedToken` full objects or user PII.

## 2. Uptime Monitoring
**Tool**: Vercel Health Checks / Status Cake (Free Tier)
- Ping the base URL `https://synergybridge-platform.com` and `/api/ai/institutional` (expecting a 401 Unauthorized, ensuring the function wakes up).

## 3. Database Usage Monitoring
**Tool**: Google Cloud Console / Firebase Console
- Track daily read/write/delete limits on Firestore.
- Set up **Firebase Budget Alerts** to notify administrators when Firestore usage exceeds 80% of the allocated budget to prevent surprise billing spikes.

## 4. AI API Usage Monitoring
**Tool**: Gemini/OpenAI Provider Dashboard + Internal Tracking
- Set hard quotas inside the AI Provider console to cap daily spend.
- SynergyBridge currently logs AI actions to the `aiUsage` or `activity` collections. Monitor these collections for abrupt volume spikes, indicating possible abuse.

## 5. Security & Auth Monitoring
**Tool**: Firebase Authentication Dashboard
- Monitor for suspicious login spikes or excessive failed authentication attempts.
- Use Firebase Identity Platform's blocking functions if abusive IPs are detected.
