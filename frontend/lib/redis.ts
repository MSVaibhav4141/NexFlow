import {Redis} from 'ioredis'

const globalRedis = global as unknown as {redis:Redis}

const REDIS_HOST= process.env.REDIS_HOST
const REDIS_PORT= process.env.REDIS_PORT
const REDIS_URI =process.env.REDIS_URI
if(!REDIS_HOST || !REDIS_PORT || !REDIS_URI){
    throw new Error("No redis config")
}
const connectionConfig = {
    host:REDIS_HOST,
    port:Number(REDIS_PORT),
    maxRetriesPerRequest:null
}
export const redis = globalRedis.redis || new Redis(REDIS_URI)

if(process.env.ENV !== "PROD") globalRedis.redis = redis;

