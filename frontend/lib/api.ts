import createClient from "openapi-fetch";
import type { paths } from "@/types/api-v1"; 

// Create the typed client
// (If you set up the Next.js rewrites earlier, use "/api/backend" as the baseUrl)
// (If not, just use your direct FastAPI URL for now: "http://localhost:8000")
export const api = createClient<paths>({ 
  baseUrl: "http://localhost:8084" 
});