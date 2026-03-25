'use server'

import { RegisterUser } from "@/types";
import { errorHandeler } from "@/lib/functionWrapper";
import { Edge, Node } from "@xyflow/react";
import { redis } from "@/lib/redis";
import { api } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOption } from "@/lib/authOption";
import { Workflow } from "@/components/workflows/workflow-context";


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
export const saveWebhook = errorHandeler(
    async({workflow_id, node, method}: {workflow_id:string, node: string, method:string}) => {
        const { data, error } = await api.POST("/api/v0/execution/config", {
    
        body: {
          workflow_id,
          node_id:node,
          method,
        }
      });

      return {data, error}
        
    }
)

export const saveForm = errorHandeler(
  async ({ workflow_id, node_id, form_title, form_description, form_elements }: {
    workflow_id: string;
    node_id: string;
    form_title?: string;
    form_description?: string;
    form_elements: any[];
  }) => {
    const { data, error } = await api.POST("/api/v0/execution/form/config", {
      body: { workflow_id, node_id, form_title, form_description, form_elements },
    });
    return { data, error };
  }
);


export const createCredential = errorHandeler(
  async ({ name, service, data }: { name: string; service: string; data: Record<string, string> }) => {
    const { data: res, error } = await api.POST("/api/v0/credentials", {
      body: { name, service, data },
    });
    return { data: res, error };
  }
);

export const fetchCredentials = errorHandeler(
  async ({ service }: { service: string }) => {
    const { data, error } = await api.GET("/api/v0/credentials/{service}", {
      params: { path: { service } },
    });
    return { data, error };
  }
);

export const deleteCredential = errorHandeler(
  async ({ id }: { id: string }) => {
    const { data, error } = await api.DELETE("/api/v0/credentials/{credential_id}", {
      params: { path: { credential_id: id } },
    });
    return { data, error };
  }
);

export async function getWorkflowsAction() {
  try {
    const {data , error} = await api.GET("/api/v0/workflows/", {
      method: "GET"
    });

    if (error) {
      throw new Error("Failed to fetch workflows");
    }

    return { success: true, data: data as Workflow[] };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, data: [], error: error.message };
  }
}

export async function getExecutionsAction() {
  try {
    const { data, error } = await api.GET("/api/v0/execution/");
    if (error) throw new Error("Failed to fetch executions");
    return { success: true, data: data };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}
