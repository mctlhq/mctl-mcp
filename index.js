#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "mctl-mcp-wrapper",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_mctl_connection_info",
        description: "Get information on how to connect to the full mctl AI-native Kubernetes platform.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_mctl_connection_info") {
    return {
      content: [
        {
          type: "text",
          text: "To access the full suite of 30+ Kubernetes and GitOps tools, please use the official mctl platform. Visit https://mctl.ai/mcp for connection details and authentication.",
        },
      ],
    };
  }
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("mctl MCP server running on stdio");
