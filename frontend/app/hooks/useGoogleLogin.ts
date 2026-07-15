"use client"
import { useState } from "react";
import { useAppDispatch } from "../lib/hooks";
import { loginSuccess } from "../lib/features/auth/authSlice";
import { loginWithGoogle } from "../lib/auth/api";


export type LoginResult = {
    success : boolean;
    message : string;
}

export function useGoogleLogin(){
    const dispatch = useAppDispatch()
    const [loading, setLoading] = useState<boolean>(false)
    const [result, setResult] = useState<LoginResult | null>(null)


    const loginGoogle = async (credentials : string): Promise<LoginResult> => {
        try {
            setLoading(true)
            const response  = await loginWithGoogle(credentials)
            dispatch(loginSuccess({accessToken : response.access_token}))
            
            const successResult  : LoginResult  = {
                success : true,
                message : "Connexion réussi. Bienvenu !",
            }
            setResult(successResult)
            return successResult
        }
        catch(error){
            const message = error instanceof Error ? error.message : "Une erreur est survenu lors pendant la connexxion.";
            const failureResult : LoginResult = {
                success : false , message
            }

            setResult(failureResult)
            return failureResult
        }
        finally{
            setLoading(false)
        }
    };
    return {loginGoogle, result, loading}
}
