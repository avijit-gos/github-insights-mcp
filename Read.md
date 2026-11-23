# How to Create an MCP Tool — Beginner's Guide (this project: `github-app`)

This `Read.md` explains, in simple language, what an MCP tool is, how this project was
created, and **step by step** how to add your own tool. Every example below is based on
the real files in this folder, so you can copy, paste, and try them.

---

## Table of Contents

1. [What is MCP, in simple words?](#1-what-is-mcp-in-simple-words)
2. [What is mcp-use and what is an "MCP App"?](#2-what-is-mcp-use-and-what-is-an-mcp-app)
3. [How this project was created (your exact commands)](#3-how-this-project-was-created-your-exact-commands)
4. [Project structure — which file does what](#4-project-structure--which-file-does-what)
5. [The big picture: how a tool works](#5-the-big-picture-how-a-tool-works)
6. [Step-by-step: create your own MCP tool](#6-step-by-step-create-your-own-mcp-tool)
7. [Full copy-paste sample: a "hello" tool with a React view](#7-full-copy-paste-sample-a-hello-tool-with-a-react-view)
8. [Walkthrough of the existing GitHub tool in this project](#8-walkthrough-of-the-existing-github-tool-in-this-project)
9. [Commands you will use every day](#9-commands-you-will-use-every-day)
10. [Testing your tool in the Inspector](#10-testing-your-tool-in-the-inspector)
11. [Common mistakes and fixes](#11-common-mistakes-and-fixes)
12. [Small glossary](#12-small-glossary)

---

## 1. What is MCP, in simple words?

**MCP = Model Context Protocol.** Think of it as a **common plug shape** for AI apps.

- An AI client (like Claude, ChatGPT, Cursor, or OpenCode) is the *socket*.
- Your server is the *plug*.
- As long as both follow the MCP rules, the AI can use your server's features without
  needing custom code for every app.

Your server can offer three things:

| Thing | Meaning | Simple example |
|---|---|---|
| **Tool** | A function the AI can *call* to do something | "Get GitHub repo info" |
| **Resource** | Data the AI can *read* | A README file |
| **Prompt** | A ready-made instruction template | "Review this code" |

In this guide we focus on **tools**, because that is what you asked for.

---

## 2. What is mcp-use and what is an "MCP App"?

- **mcp-use** is a TypeScript framework that makes writing an MCP server easy.
  Instead of handling low-level protocol details yourself, you write normal functions
  and register them with `server.tool(...)`.
- An **MCP App** is an MCP server that also ships a **React view** — a small UI that
  appears inside the AI client when the tool runs. In this project, the tool returns
  GitHub stats and the view displays them as nice cards.

So one tool has two possible outputs:

1. **Text / structured data** for the AI model to read (`content` + `structuredContent`).
2. **A visual UI** for the human to see (the `view` + a file in `views/`).

---

## 3. How this project was created (your exact commands)

You used these two commands:

### Command 1 — create and install the project

```bash
npx create-mcp-use-app@latest github-app --template mcp-apps --npm --install
```

What each part means:

| Part | Meaning |
|---|---|
| `npx create-mcp-use-app@latest` | Download and run the newest project generator (no global install needed). |
| `github-app` | The name of the new folder / project. |
| `--template mcp-apps` | Use the **MCP Apps** template: tools **plus React views**. |
| `--npm` | Use npm as the package manager (creates `package.json`, `package-lock.json`). |
| `--install` | Install all dependencies immediately after creating the files. |

### Command 2 — install again without skills

```bash
npm install --no-skills
```

- `npm install` makes sure every dependency in `package.json` is present.
- `--no-skills` skips the optional **agent skills** installation (extra instruction files
  for tools like Claude Code / Cursor). You do **not** need skills to build normal MCP
  tools, so this is perfectly fine. If you later want skills, you can install them
  separately.

### What got installed (from `package.json`)

| Package | Why it is here |
|---|---|
| `mcp-use` | The server framework (`MCPServer`, React hooks, CLI). |
| `zod` | Defines and validates the input/output shapes of tools. |
| `react`, `react-dom` | Build the optional visual views. |
| `typescript`, `@types/*` | Type checking (catches mistakes before running). |

> **Node version:** this project requires **Node.js >= 22.22.2** (see `engines` in
> `package.json`). Check with `node -v`.

---

## 4. Project structure — which file does what

```
github-app/
├── index.ts                  ← server + all tool definitions (main file)
├── github.ts                 ← helper function: calls the GitHub API
├── landing.tsx               ← the web page shown at http://localhost:3000/mcp
├── mcp-env.d.ts              ← generated types that connect tools ↔ views (do not edit)
├── tsconfig.json             ← TypeScript settings
├── package.json              ← scripts and dependencies
├── views/
│   └── repository/
│       └── view.tsx          ← React UI for the "get-repository-overview" tool
├── public/                   ← icons / static assets
└── .mcp-use/                 ← internal cache (do not edit)
```

**The two most important files for you:**

- `index.ts` → where you create tools.
- `views/<name>/view.tsx` → where you draw the UI (optional).

---

## 5. The big picture: how a tool works

When an AI calls your tool, this happens:

```
AI client  ──calls──▶  MCPServer (index.ts)
                          │
                          ├─ 1. zod checks the input (owner, repo)
                          ├─ 2. your callback runs (fetch GitHub data)
                          └─ 3. callback returns:
                                content: [{ type: "text", text: "..." }]  ← for the AI
                                structuredContent: data                  ← for the view
                                          │
                                          ▼
                                  views/repository/view.tsx  ← shows the data as UI
```

Every tool has 4 ingredients:

| Ingredient | Required? | What it is |
|---|---|---|
| `name` | Yes | Unique id, e.g. `"get-repository-overview"`. |
| `description` | Recommended | Tells the AI when to use the tool. |
| `inputSchema` | Recommended | A zod object describing the arguments. |
| callback function | Yes | The actual code that runs. |
| `outputSchema` + `view` | Optional | Output validation and a React UI. |

---

## 6. Step-by-step: create your own MCP tool

Let's build a simple tool called **`add-numbers`** that adds two numbers. Then we'll
add a view for it.

### Step 1 — Open `index.ts`

At the top you already have:

```ts
import { MCPServer } from "mcp-use";
import { z } from "zod";
```

`MCPServer` creates the server; `z` comes from zod and describes your data.

### Step 2 — Make sure a server exists

This is already in your file (lines 7–14):

```ts
const server = new MCPServer({
  name: "github-insights-mcp",
  title: "Github Repository Insights",
  version: "1.0.0",
  description: "Public github repo stats",
  instructions: "Call get-repository-overview with repo & owner name",
  websiteUrl: "https://mcp-use.com",
});
```

You can keep this server and add more tools to it — you do **not** need a new server for
each tool. (You may want to update `description`/`instructions` when you add tools.)

### Step 3 — Define the input schema (what arguments the tool accepts)

```ts
const addNumbersInputSchema = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});
```

- `z.object({...})` means "an object with these fields".
- `.describe(...)` is a hint shown to the AI so it knows what to fill in.
- mcp-use checks the input **before** your code runs. If the AI sends text instead of a
  number, the tool call fails automatically — you don't need to write that check.

### Step 4 — (Optional) Define the output schema

```ts
const addNumbersOutputSchema = z.object({
  sum: z.number().describe("The result of a + b"),
});
```

When you provide an `outputSchema`, your callback **must** return `structuredContent`
matching this shape. It is like a contract.

### Step 5 — Register the tool with `server.tool(...)`

Add this to `index.ts` **before** `export default server;`:

```ts
export const addNumbers = server.tool(
  {
    name: "add-numbers",
    title: "Add two numbers",
    description: "Adds two numbers and returns the sum. Use it for simple math.",
    inputSchema: addNumbersInputSchema,
    outputSchema: addNumbersOutputSchema,
  },
  async ({ a, b }) => {
    const result = { sum: a + b };

    return {
      content: [{ type: "text", text: `${a} + ${b} = ${result.sum}` }],
      structuredContent: result,
    };
  }
);
```

Important details:

- **`export const addNumbers = ...` is important.** The original project's README says:
  statically declared tools used by views must be assigned to exported constants.
  This is how `mcp-env.d.ts` learns the tool's types.
- The first argument is the **definition** (name, description, schemas).
- The second argument is the **callback** — a normal `async` function. Its parameter
  `{ a, b }` is automatically typed from your zod schema.
- `content` is what the AI model reads as text.
- `structuredContent` is clean JSON used by the view (and validated by `outputSchema`).

### Step 6 — Keep the default export at the end

`index.ts` must end with:

```ts
export default server;
```

This is how the mcp-use CLI finds and starts your server.

### Step 7 — (Optional) Add a React view

If you want a visual UI, add a `view` field to the tool definition in Step 5:

```ts
    view: {
      name: "sum",           // must match the folder name in views/
    },
```

Then create **`views/sum/view.tsx`** (see the full sample in the next section).

Rules:

- The `name` in `view` must exactly match the folder name under `views/`.
- **One view can be bound to only one tool.** Do not point two tools at the same view.
- Without `view`, the tool still works — it just has no UI.

### Step 8 — Refresh types and check for errors

```bash
npm run typecheck
```

This regenerates type information in `mcp-env.d.ts` and checks your TypeScript. If you
added a view and used `useToolContext<"add-numbers">()`, this step makes that type
known. (The file itself is generated — don't edit it by hand.)

### Step 9 — Run and test

```bash
npm run dev
```

Open <http://localhost:3000/mcp/inspector>, pick your tool, fill in the inputs, and
click run. The server auto-reloads when you edit files.

---

## 7. Full copy-paste sample: a "hello" tool with a React view

Here is a complete second tool you can paste into your current `index.ts`. It shows all
the pieces together.

### Part A — add to `index.ts`

```ts
/** @format */

// ... your existing imports stay at the top ...
import { MCPServer } from "mcp-use";
import { z } from "zod";

// ... your existing server and github tool stay here ...

// 1. Input: what the caller sends
const greetInputSchema = z.object({
  name: z.string().describe("Name of the person to greet"),
});

// 2. Output: what we give back
const greetOutputSchema = z.object({
  message: z.string().describe("The greeting message"),
});

// 3. Register the tool. Export it so views get its types.
export const greetUser = server.tool(
  {
    name: "greet-user",
    title: "Greet a user",
    description: "Returns a friendly hello message for a given name.",
    inputSchema: greetInputSchema,
    outputSchema: greetOutputSchema,
    view: {
      name: "greeting",
    },
  },
  async ({ name }) => {
    const data = { message: `Hello, ${name}! 👋 Welcome to MCP.` };

    return {
      content: [{ type: "text", text: data.message }],
      structuredContent: data,
    };
  }
);

// Keep this at the very bottom
export default server;
```

### Part B — create `views/greeting/view.tsx`

```tsx
/** @format */

import { ThemeProvider, ErrorBoundary, useToolContext } from "mcp-use/react";

export default function GreetingView() {
  return (
    <ThemeProvider>
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <GreetingContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function GreetingContent() {
  // The string matches the tool's `name` in index.ts
  const { status, toolInput, toolOutput, error } =
    useToolContext<"greet-user">();

  if (status === "pending") return <p>Saying hello to {toolInput?.name}...</p>;
  if (status === "error") return <p>Error: {error.message}</p>;

  // toolOutput is the `structuredContent` returned by the tool
  const result = toolOutput as { message: string };

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        border: "1px solid GrayText",
        maxWidth: 480,
      }}>
      <h2>{result.message}</h2>
    </div>
  );
}
```

### Part C — run

```bash
npm run typecheck   # teaches the view about the new tool
npm run dev         # start the server
```

Open the Inspector, call `greet-user` with `{"name": "Avi"}`, and you will see
`Hello, Avi! 👋 Welcome to MCP.` both as text and as a small card UI.

---

## 8. Walkthrough of the existing GitHub tool in this project

Your current tool lives in `index.ts` (lines 16–64) and uses `github.ts`.

**Step 1 — input schema** (lines 16–19): requires `owner` and `repo` strings.

```ts
const getRepoOverviewInputSchema = z.object({
  owner: z.string().describe("Owner name of the github repository"),
  repo: z.string().describe("Github repo name"),
});
```

**Step 2 — output schema** (lines 21–39): describes the exact JSON we return
(`name`, `description`, `forks_count`, `stargazers_count`, `language`,
`open_issues_count`, `html_url`).

**Step 3 — helper function** (`github.ts`): keeps the network code separate. It:

1. trims and checks that `owner` and `repo` are not empty;
2. builds the URL `https://api.github.com/repos/{owner}/{repo}`;
3. uses `fetch` with GitHub API headers;
4. handles errors (404 = not found, 403 = rate limit);
5. returns only the fields we need.

**Step 4 — register the tool** (lines 42–64):

```ts
export const getGithubRepoOverview = server.tool(
  {
    name: "get-repository-overview",
    title: "Get gihub repository overview",
    description: "Get github repo stats",
    inputSchema: getRepoOverviewInputSchema,
    outputSchema: getRepoOverviewOutputSchema,
    view: { name: "repository" }, // connects to views/repository/view.tsx
  },
  async ({ owner, repo }) => {
    const data = await fetchGithubRepoInfo(repo, owner);
    // ...build a human-readable summary...
    return {
      content: [{ type: "text", text: summary }],       // for the AI
      structuredContent: data,                          // for the view
    };
  }
);
```

**Step 5 — the view** (`views/repository/view.tsx`):

- `ThemeProvider` + `ErrorBoundary` give it theming and crash protection.
- `useToolContext<"get-repository-overview">()` gives it `status`, `toolInput`,
  `toolOutput`, and `error`.
- It handles three states: `pending` (loading), `error`, and success (the stat cards).
- The `name` in `useToolContext<"..." >()` must match the tool name in `index.ts`.

---

## 9. Commands you will use every day

All commands come from `package.json` scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with auto-reload (development). |
| `npm run typecheck` | Refresh generated view types and check TypeScript. Run after editing tools/views. |
| `npm run build` | Create the production bundle. |
| `npm run start` | Run the built server. |
| `npm run deploy` | Deploy to Manufact Cloud. |
| `npm install` | (Re)install dependencies. |

Useful URLs while `npm run dev` is running:

| URL | What it shows |
|---|---|
| <http://localhost:3000/mcp> | In a **browser**: the landing page (edit `landing.tsx`). For an **MCP client**: the server endpoint itself — same URL, different behavior. |
| <http://localhost:3000/mcp/inspector> | Interactive tool tester. |

---

## 10. Testing your tool in the Inspector

1. Run `npm run dev`.
2. Open <http://localhost:3000/mcp/inspector>.
3. Find your tool in the tool list (the `title` or `name` from `index.ts`).
4. Fill in the input fields generated from your zod schema.
5. Click **Run / Call tool**.
6. Check:
   - the **text** result (`content`) — this is what the AI sees;
   - the **structured data** (`structuredContent`);
   - the **view** — if you added one, it renders in the Inspector too.

You can also open the landing page and use its **install targets** to add this server to
Claude, Cursor, ChatGPT, or another MCP client.

---

## 11. Common mistakes and fixes

| Problem | Fix |
|---|---|
| View shows "Tool not found" or no types | Run `npm run typecheck`, and make sure the tool is `export const ...`. |
| `useToolContext<"my-tool">()` has a red squiggle | The string must exactly equal the tool's `name` in `index.ts`. Run `npm run typecheck`. |
| My view never appears | Check `view: { name: "xxx" }` matches the folder `views/xxx/view.tsx` exactly (case-sensitive). |
| Two tools share one view | Not allowed — one view can be bound to only one tool. Make a second view folder. |
| TypeScript error about imports | In this project imports use `.js` extensions even for `.ts` files, e.g. `./github.js` (ESM + NodeNext style). |
| "Cannot find module mcp-use/react" | Check dependencies are installed: `npm install`. |
| Server does not start | Make sure `index.ts` ends with `export default server;`. |
| Node version error | Use Node.js >= 22.22.2 (`node -v` to check). |
| GitHub API rate limit | Tool returns a 403 message; wait a while or add a GitHub token to the request headers. |
| I edited `mcp-env.d.ts` and it broke | Don't edit it — it is generated by `npm run typecheck`. |

---

## 12. Small glossary

| Term | Meaning |
|---|---|
| **Tool** | A function an AI can call. |
| **View** | A React UI shown when a tool runs (MCP App). |
| **Schema** | A description of data shape; here written with zod. |
| **zod** | Library that validates data at runtime (`z.string()`, `z.object({...})`). |
| **Callback** | The function you write that actually does the work. |
| **`content`** | Text result returned to the AI model. |
| **`structuredContent`** | JSON result returned to the view. |
| **Inspector** | Built-in web page for testing tools. |
| **mcp-use** | The framework this project is built with. |

---

### TL;DR — the shortest recipe

```ts
export const myTool = server.tool(
  {
    name: "my-tool",
    description: "What the AI should use this for",
    inputSchema: z.object({ value: z.string() }),
  },
  async ({ value }) => ({
    content: [{ type: "text", text: `You said: ${value}` }],
  })
);
```

Then: `npm run typecheck` → `npm run dev` → open the Inspector → call `my-tool`. 🎉
