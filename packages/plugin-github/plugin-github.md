# sqrAI Plugin - GitHub Integration

## Introduction

This folder contains the source code for a GitHub plugin designed to extend the capabilities of the sqrAI agent. The plugin provides actions for cloning repositories, summarizing them, querying project details, generating documentation, creating files, and creating pull requests. It also includes database schema definitions and utility functions.

## File Descriptions

-   **`.npmignore`**: Specifies files and directories that should be ignored when publishing the package to npm.
-   **`eslint.config.mjs`**:  Configuration file for ESLint, extending a global ESLint configuration.
-   **`package.json`**: Defines the package metadata, dependencies, and scripts for the plugin.
-  **`schema.sql`**: SQL schema definition for creating tables to store repository and code file information in a PostgreSQL database, including indexes for efficient querying and vector embeddings for semantic search.
-   **`src/actions/clone.ts`**: Implements actions to clone a GitHub repository locally and save the metadata into database, also create embedding from files in repo.
-   **`src/actions/createPR.ts`**: Implements an action to create a pull request on GitHub.
-   **`src/actions/createfile.ts`**: Implements an action to create a file with the provided content, based on file path and content from context.
-   **`src/actions/gendoc.ts`**: Implements an action to generate documentation (README.md) for a given folder in a repository.
-   **`src/actions/summarize.ts`**: Implements actions to summarize a GitHub repository, extracting information about its structure, purpose, usage, and target users.
-   **`src/actions/utils.ts`**: Provides utility functions for file system operations, such as getting file structures, converting them to text, and loading files.
-   **`src/constants.ts`**: Defines constants used within the plugin, such as `GITHUB_CONSTANTS`.
-   **`src/index.ts`**: The main entry point for the plugin, defining its actions and integrating with the Eliza framework. It also initializes the database connection and schema.
-    **`src/repo_api.ts`**: Defines an Express router for exposing API endpoints to retrieve repository data.
-   **`src/services/pg.ts`**: Implements a singleton class for managing PostgreSQL database connections using a connection pool.
-   **`src/utils.ts`**: Provides utility functions for interacting with the database (extracting repo name and owner), querying related code files based on embedding similarity and other helper methods
-  **`tsconfig.json`**: Configuration file for TypeScript compiler settings specific to this package.
 - **`tsup.config.ts`**: Configuration file for tsup, a TypeScript bundler.

## Usage Instructions

### General Setup
1.  Ensure you have Node.js and npm (or yarn) installed.
2.  Install the dependencies by running `npm install` in the `packages/plugin-github` directory or via workspace manager command.
3.  Set up your PostgreSQL database and provide the connection string as an environment variable `POSTGRES_URL`.
4.  Provide GITHUB_API_TOKEN as an environment variable to interact with Github API

### File Specific Instructions
-   **`eslint.config.mjs`**: This file doesn't need direct execution, it's used by ESLint to lint code.
-   **`package.json`**: Used by npm/yarn for package management. No direct execution is needed.
-   **`schema.sql`**: Execute this SQL script against your PostgreSQL database to create the necessary tables and indexes for the plugin:
    ```bash
    psql -U <your_username> -d <your_database> -f schema.sql
    ```
-   **`src/actions/clone.ts`**: This is used by agent, no direct execution. It contains functions for cloning repositories and saving metadata to the database. The `cloneRepoAction` is an `Action` object used by Eliza agent.
-   **`src/actions/createPR.ts`**: This is used by agent, no direct execution. It contains functions for creating pull requests on GitHub. The `createPRAction` is an `Action` object used by Eliza agent.
-   **`src/actions/createfile.ts`**: This is used by agent, no direct execution. It contains functions for creating a file based on context and user input. The `createFileAction` is an `Action` object used by Eliza agent.
-   **`src/actions/gendoc.ts`**: This is used by agent, no direct execution. It contains functions for generating documentation (README) for a given folder in a repository. The `gendocAction` is an `Action` object used by Eliza agent.
-   **`src/actions/summarize.ts`**: This is used by agent, no direct execution. It contains functions for summarizing a repository. The `summarizeRepoAction` is an `Action` object used by Eliza agent.
-   **`src/actions/utils.ts`**: This file doesn't need direct execution, it's used by other files in the plugin as utility function to work with file system
-   **`src/constants.ts`**: This file doesn't need direct execution, it contains constants used in the project
-  **`src/index.ts`**: This is the main entry point of the plugin and should be loaded by the Eliza framework. No direct execution is needed.
-  **`src/repo_api.ts`**: This file defines the API routes for fetching repository information. This should be mounted on the main express app by `eliza`.
-   **`src/services/pg.ts`**: This file doesn't need direct execution, it's used by other files in the plugin.
-   **`src/utils.ts`**: This file doesn't need direct execution, it's used by other files in the plugin as utility function to work with database
-   **`tsconfig.json`**: This file is used by the TypeScript compiler during the build process. No direct execution is needed.
-  **`tsup.config.ts`**: This file is used by tsup to bundle the typescript code, no direct execution. To build the project, run `npm run build`.

## Dependencies

-   **Node.js**: Required for running JavaScript code and using npm/yarn.
-   **npm** or **yarn**: Package managers for installing dependencies.
-   **TypeScript**: For type checking and compiling TypeScript code (dev dependency).
-   **@ai16z/eliza**: Core library for AI agent framework.
-  **express**: Web framework to create API endpoints for fetching data
 - **@octokit/rest**, **@octokit/types**: GitHub API client libraries for interacting with GitHub REST API and its types.
 -  **pg**: PostgreSQL client library for database interaction.
 -   **simple-git**: Library for interacting with Git repositories programmatically.
 -   **tsup**: A tool that bundles TypeScript projects quickly and efficiently
 - **uuid:** Library for generating unique identifiers

## Additional Notes

*   The plugin assumes a working directory setup where repositories can be cloned into `.repos` directory relative to root folder of the agent.. 
* Ensure correct environment variables are set: `POSTGRES_URL` (for database connection) and `GITHUB_API_TOKEN` (for GitHub API access). Set env variable `GITHUB_PATH` if you want to specify a subfolder path to index from repo after cloning it instead of indexing whole repository folder, this env variable should be relative path to root of repository folder, example: src, docs etc...
* The plugin uses vector embeddings to perform semantic search on code files.
* The `schema.sql` file contains a function to determine embedding dimension depending on use of OpenAI or Ollama, if none is set, the default dimension is 384. If you use OpenAI, make sure to set `app.use_openai_embedding` setting to `true`. If using Ollama, make sure to set `app.use_ollama_embedding` to `true`.
* The `src/index.ts` file initializes the database on startup using the provided schema.
*   The plugin includes actions for cloning, summarizing, querying project details, generating documentation, creating files and creating pull requests which are designed to be used within the Eliza agent framework.
*  The plugin includes an API endpoint at `/repos` (defined in `src/repo_api.ts`) that returns a list of all repositories stored in the database. This API endpoint is meant to be used by UI or other external applications.

This README provides a basic overview of the files and their purpose. For more detailed information about each action, refer to the source code directly or check documentation from Eliza package if available.
 
source repo: /app/agent/.repos/sqrDAO/sqrAI