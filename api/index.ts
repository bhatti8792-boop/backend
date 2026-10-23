import app from "../src/app.js";
 
// Vercel treats the Express app as the serverless handler.
// DB connection is handled by middleware inside app.ts.
export default app;
 