import axios from "axios";

export function getMarkdown(url: string) {
  const options = {
    method: "GET",
    url: url,
    headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    },
  };
  
  return axios.request(options);
}