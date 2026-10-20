import { app } from '../server.ts';

// Vercel maps every /api/* request to this serverless function while preserving
// its original pathname, allowing Express to serve the existing API contract.
export default app;
