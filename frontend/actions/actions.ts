'use server'

import { RegisterUser } from "@/types";
import { errorHandeler } from "@/lib/functionWrapper";
import { Edge, Node } from "@xyflow/react";
import { redis } from "@/lib/redis";
import { api } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOption } from "@/app/api/auth/[...nextauth]/route";


export const verifyOtpRequest = async({otp, email}: {otp:string, email:string}) => {
    const savedOtp = await redis.hget('otp-set',email)

    if(!savedOtp){
        return {
            success:false,
            mssg:"Incorrect otp"
        };
    }
    
    if(Number(savedOtp) === Number(otp)){
        return {
            success:true,
            mssg:"Otp Verified Successfully"
        };
    }else{
        return {
            success:false,
            mssg:"Incorrect otp"
        };
    }
}

export const registerUser =errorHandeler(
    async({email, password,name, accountName}:RegisterUser) => {
        
        const {data,response, error} = await api.POST('/api/v0/user/register', {
            body:{
                email, 
                password, 
                name, 
                accountName
            }
        })

        if(error){
            throw new Error("registeration failed")
        }
        return {...data};
    }

)

export const saveWorkflow = errorHandeler(
    async({nodes, edges, id}: {nodes:Node[], edges: Edge[], id:string}) => {
        const session = await getServerSession(authOption)

        if(!session?.user.id){
            throw new Error("User not verified")
        }
        await api.PUT('/api/v0/workflows/workflow', {
            body:{
                id,
                user_id: session.user.id,
                edges,
                nodes
            }
        })
        
    }
)