import { fetchJson } from "../api/fetchJson";
import { ContactData } from "./contact";

const API = process.env.NEXT_PUBLIC_API_BACK_END

export async function sendContactForm(payload: ContactData ) {
    return fetchJson(`${API}/contact/send` , {
        method : "POST", 
        headers : { "Content-Type": "application/json"},
        body : JSON.stringify(payload)
    })
}