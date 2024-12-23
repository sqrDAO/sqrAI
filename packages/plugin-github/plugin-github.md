# @sqrdao/plugin-github

## Introduction

This folder contains the source code for a GitHub plugin designed to extend the functionality of the `eliza` agent framework. It provides actions for interacting with GitHub repositories, including cloning, summarizing, generating documentation, creating files, and submitting pull requests. Additionally it includes an API to query the created database about repositories.

## File Descriptions

-   **`.npmignore`**: Specifies files that should be ignored when publishing the package to npm. It excludes all files except those explicitly included using `!`.
-   **`eslint.config.mjs`**: Configuration file for ESLint, extending a global ESLint configuration.
-   **`package.json`**: Defines the package's metadata, dependencies, and scripts for building and linting the project.
-   **`schema.sql`**: SQL file containing the database schema for storing repository and code file information, including embedding vectors for semantic search.
-   **`src/actions/clone.ts`**: Implements actions to clone a GitHub repository locally, index its files into a database, create embeddings of their contents and store them in the database.
-   **`src/actions/createPR.ts`**: Implements an action to create a pull request on GitHub using `simple-git`.
-   **`src/actions/createfile.ts`**: Implements an action that creates a file with provided content into a specified path within the cloned repo.
-  **`src/actions/gendoc.ts`**: Implements an action that generates documentation (README) for code inside of a folder of the cloned repository using LLM.
-   **`src/actions/summarize.ts`**: Implements actions to summarize a GitHub repository by analyzing its file structure and content using LLM..
-  **`src/actions/utils.ts`**: Provides utility functions for handling files such as reading files or generating file structure trees.
-   **`src/constants.ts`**: Defines constants used within the plugin, such as `REPO`.
-   **`src/index.ts`**: The main entry point for the plugin, defining its actions and initializing the database connection on start up.. It also includes logic to query information about repositories from local copies using LLM based on user questions .
- ** `src/repo_api.ts`: ** Defines API endpoints to query repositories data from the local db via express router.** 
 -  ** `src/services/pg.ts`: ** Provides singleton pattern implementation to connect to postgresql.** 
 -  ** `src/utils.ts`: ** Provides utility functions to query repositories data from the local db.** 
-   **`tsconfig.json`**: Configuration file for TypeScript compiler.
-   **`tsup.config.ts`**: Configuration file for `tsup`, a TypeScript bundler.

## Usage Instructions

### General Setup

1.  Ensure you have Node.js and npm (or yarn) installed.
2.  Clone this repository or copy the files into your project directory where you use `eliza`.
3.  Install the dependencies by running `npm install` or `yarn install` in the `packages/plugin-github` folder.

### File-Specific Instructions

-   **`eslint.config.mjs`**: This file is automatically used by ESLint when linting the project and doesn't need to be executed directly.
-   **`package.json`**: This file is used by npm or yarn to manage the project's dependencies and scripts. You can use the defined scripts (e.g., `npm run build`, `npm run lint`)
-   **`schema.sql`**: This SQL file is executed by the plugin on initialization to set up its database schema, it does not need to be executed manually.

-   **`src/actions/clone.ts`**: This file exports an action named `CLONE_REPO`. It's used by the `eliza` framework, and can be triggered using a message that includes a valid GitHub repository URL. Example usage as part of a message: `"Clone this repository: https://github.com/ai16z/eliza"`.
-   **`src/actions/createPR.ts`**:  This file exports an action named `CREATE_PULL_REQUEST`. It's used by the `eliza` framework, and can be triggered using a message that includes text such as "Create a pull request". The plugin uses context from previous messages to gather information about repos and files where changes should be created and then generate commit messages, PR titles, and descriptions to create the PR on github using token from environment variables configured for agent runtime.
-   **`src/actions/createfile.ts`**: This file exports an action named `CREATE_FILE`. It's used by the `eliza` framework, and can be triggered using a message that includes text such as "Create file in folder /path/to/folder with content: Hello, World!". The plugin will extract path information from context or user message to create the file locally in cloned repo folder specified by user or in context document when available..
 -   **`src/actions/gendoc.ts`**: This file exports an action named `GEN_DOC`. It's used by the `eliza` framework, and can be triggered using a message that includes text such as "Generate documentation for code in repository project-management-tool and folder src/utils". The plugin will use LLM to generate README file based on contents of files in specified folder inside the cloned repo.
-   **`src/actions/summarize.ts`**: This file exports an action named `SUMMARIZE_REPO`. It's used by the `eliza` framework, and can be triggered using a message that requires summarization of a cloned repository. Example usage as part of a message: `"Summarize this repository"`.
-    **`src/index.ts`**: This is the main plugin file and does not need to be run directly. It is imported by the `eliza` framework for integration of all defined actions into agent runtime when the plugin is registered via config.
 -  ** `src/repo_api.ts`: ** This file exposes API endpoints which are intended to be used with express router, it doesn't require direct execution.** 

## Dependencies

### Required Libraries

-   `@ai16z/eliza`: Core library for building AI agents.
-   `express`: Web framework for Node.js used in API endpoints
-   `@octokit/rest`: GitHub API client for interacting with GitHub repositories
-   `@octokit/types`: Types for octokit.
-   `pg`: PostgreSQL client for Node.js used for database interactions.
-   `simple-git`: A library to interact with git repositories programmatically.
-   `tsup`: TypeScript bundler
- `@types/express`: Typescript types for express package

### Tools

-   Node.js and npm (or yarn).
-   PostgreSQL database server to store the repo information.

## Additional Notes

*   The plugin assumes a working directory is set up where the repositories will be cloned into a `.repos` folder at root level of execution when `cloneRepoAction` is triggered.
*   The plugin uses `process.env.POSTGRES_URL` to connect to a PostgreSQL database. Make sure to set this environment variable before starting the agent with the github plugin.
*  The plugin uses `GITHUB_API_TOKEN` from runtime settings for authentication when creating PRs via action createPRAction, make sure that the token is available in runtime settings of eliza agent.
* The plugin uses `GITHUB_PATH` from runtime settings to specify which folder should be indexed when cloning a repository, if not present it will index all files in the cloned repo folder.
*  The embedding dimension used in the schema is 384 by default, you can change it based on your embedding model by enabling the function in `schema.sql`. If using OpenAI embedding model set env variable `app.use_openai_embedding` to 'true', otherwise if using ollama mxbai-embed-large model, set env variable `app.use_ollama_embedding` to 'true'. This will automatically return correct dimensions for both models: 1536 for OpenAI and 1024 for mxbai-embed-large, or default value of 384 if both variables are not enabled.
```
 
source repo: /app/agent/.repos/sqrDAO/sqrAI