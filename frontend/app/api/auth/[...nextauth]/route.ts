import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcrypt'
import { api } from "@/lib/api";

export const authOption: NextAuthOptions = {
  providers:[
    CredentialsProvider({
    // The name to display on the sign in form (e.g. 'Sign in with...')
    name: 'Sign In',
    // The credentials is used to generate a suitable form on the sign in page.
    // You can specify whatever fields you are expecting to be submitted.
    // e.g. domain, username, password, 2FA token, etc.
    // You can pass any HTML attribute to the <input> tag through the object.
    credentials: {
      email: { label: "Username", type: "text", placeholder: "jsmith" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials, req) {

    if(!credentials?.email || !credentials?.password){
        return null;
    }
    const {data, error} = await api.POST("/api/v0/user/login", {
      body:{
        email:credentials.email,
        password:credentials.password
      }
    })
    if(error){
        return null;
    }
    
      if (data) {
        return data
      }
      return null
    }
  })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session:{
    strategy:"jwt",
    maxAge: 24 * 60 * 60 
  },
  callbacks:{
    async jwt({token, user}){
        if(user){
          token.sub = user.id
            token.id = user.id
        }
        return token;
    },
   async session({ session, token }) { 
        if (session.user && token) {
            session.user.id = token.id as string; 
        }
        return session;
    }
  }
}

const handler = NextAuth(authOption)

export { handler as GET, handler as POST }