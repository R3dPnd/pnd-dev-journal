import { Octokit } from "@octokit/core";

const octokit = new Octokit({
  auth: 'YOUR-TOKEN'
})

export async function getMarkDown(): Promise<any> {
    await octokit.request('POST /markdown', {
  text: 'Hello **world**',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})}