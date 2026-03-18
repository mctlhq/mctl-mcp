#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

// Polyfill EventSource for the MCP SDK to use in Node.js
global.EventSource = EventSource;

async function run() {
  const token = process.env.MCTL_API_KEY || process.env.MCTL_TOKEN || process.env.MCTL_ACCESS_TOKEN;
  
  if (!token) {
    console.error("Error: MCTL_API_KEY or MCTL_TOKEN environment variable is required.");
    process.exit(1);
  }

  // Base API endpoint for the SSE connection
  const baseUrl = process.env.MCTL_API_URL || "https://api.mctl.ai/mcp/sse";
  const sseUrl = new URL(baseUrl);

  // Initialize SSE Transport (Remote connection)
  const clientTransport = new SSEClientTransport(sseUrl, {
    eventSourceInit: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Initialize STDIO Transport (Local connection to Claude/Cursor)
  const serverTransport = new StdioServerTransport();

  // Pipe messages bidirectionally between the local IDE and the remote backend
  clientTransport.onmessage = (message) => {
    serverTransport.send(message).catch((err) => {
      console.error("Failed to forward message to STDIO:", err);
    });
  };

  serverTransport.onmessage = (message) => {
    clientTransport.send(message).catch((err) => {
      console.error("Failed to forward message to SSE:", err);
    });
  };

  // Handle connection events and errors
  clientTransport.onerror = (err) => {
    console.error("SSE Transport Error:", err);
  };

  clientTransport.onclose = () => {
    console.error("Remote SSE connection closed");
    process.exit(0);
  };

  serverTransport.onerror = (err) => {
    console.error("STDIO Transport Error:", err);
  };

  serverTransport.onclose = () => {
    console.error("STDIO connection closed");
    process.exit(0);
  };

  // Start both transports
  await clientTransport.start();
  await serverTransport.start();

  console.error(`mctl MCP proxy is running. Connected to ${baseUrl}`);
}

run().catch((error) => {
  console.error("Fatal proxy error:", error);
  process.exit(1);
});
