import axios, { AxiosResponse } from "axios";
import { CustomHeaders } from "./types";


export async function fetchEvents(serverEndpoint: string, fetch: number, headers: CustomHeaders): Promise<AxiosResponse<any, any>> {
    const result = await axios.get(`${serverEndpoint}/events?fetch=${fetch}`, {
        headers: headers as any,
    });
    return result;
}

export async function sendReply(serverEndpoint: string, body: any, headers: CustomHeaders): Promise<AxiosResponse<any, any>> {
    const result = await axios.get(`${serverEndpoint}/callback`, {
        headers: headers as any,
        data: body
    });
    return result;
}
