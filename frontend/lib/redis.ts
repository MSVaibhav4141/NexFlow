import {Redis} from 'ioredis'

const globalRedis = global as unknown as {redis:Redis}

const REDIS_HOST= process.env.REDIS_HOST
const REDIS_PORT= process.env.REDIS_PORT

if(!REDIS_HOST || !REDIS_PORT){
    throw new Error("No redis config")
}
const connectionConfig = {
    host:REDIS_HOST,
    port:Number(REDIS_PORT),
    maxRetriesPerRequest:null
}
export const redis = globalRedis.redis || new Redis(connectionConfig)

if(process.env.ENV !== "PROD") globalRedis.redis = redis;

