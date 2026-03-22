import createClient, { Middleware } from "openapi-fetch";
import type { paths } from "@/types/api-v1"; 
import { getServerSession } from "next-auth";
import { authOption } from "@/lib/authOption";

// Create the typed client
// (If you set up the Next.js rewrites earlier, use "/api/backend" as the baseUrl)
// (If not, just use your direct FastAPI URL for now: "http://localhost:8000")
export const api = createClient<paths>({ 
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL 
});

const UNPROTECTED_ROUTE = [
  "/api/v0/user/login",
  "/api/v0/user/signup",
]
const middleware: Middleware = {
  async onRequest({request, schemaPath}) {

    const isProtected = !UNPROTECTED_ROUTE.includes(schemaPath)
    console.log(isProtected)

    if(!isProtected){
      return undefined
    }

   if (typeof window === "undefined") {
      const session = await getServerSession(authOption);
      const token = session?.user?.encoded;

      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return request
  }
}

api.use(middleware)