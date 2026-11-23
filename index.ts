/** @format */

import { MCPServer } from "mcp-use";
import { fetchGithubRepoInfo } from "./github.js";
import { z } from "zod";

const server = new MCPServer({
  name: "github-insights-mcp",
  title: "Github Repository Insights",
  version: "1.0.0",
  description: "Public github repo stats",
  instructions: "Call get-repository-overview with repo & owner name",
  websiteUrl: "https://mcp-use.com",
});

const getRepoOverviewInputSchema = z.object({
  owner: z.string().describe("Owner name of the github repository"),
  repo: z.string().describe("Github repo name"),
});

const getRepoOverviewOutputSchema = z.object({
  name: z.string().describe("Name of the github repository"),
  description: z
    .string()
    .nullable()
    .describe("Description of the github repository"),
  forks_count: z.number().describe("Total fork count of the github repository"),
  stargazers_count: z
    .number()
    .describe("Total stargazers count of the github repository"),
  language: z
    .string()
    .nullable()
    .describe("Name of the language used in that github repository"),
  open_issues_count: z
    .number()
    .describe("Total open issue count of the github repository"),
  html_url: z.string().describe("HTML url of the github repository"),
});

// Register your tool with the MCP
export const getGithubRepoOverview = server.tool(
  {
    name: "get-repository-overview",
    title: "Get gihub repository overview",
    description: "Get github repo stats",
    inputSchema: getRepoOverviewInputSchema,
    outputSchema: getRepoOverviewOutputSchema,
    view: {
      name: "repository",
    },
  },
  async ({ owner, repo }) => {
    const data = await fetchGithubRepoInfo(repo, owner);
    const language = data?.language ?? "No language present";
    const description = data?.description ?? "No description present";
    const summary = `Name of the repo ${data.name} and description of the repo ${description} and language: ${language}, total number of star: ${data.stargazers_count}, total number of open issues: ${data.open_issues_count}, total number of forks: ${data.forks_count} and repo's html url: ${data.html_url}`;

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: data,
    };
  }
);

export default server;
