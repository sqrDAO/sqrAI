# Plugin GitHub

## Introduction
This folder contains the source code for a GitHub plugin designed to interact with GitHub repositories. It includes functionalities for cloning, summarizing, querying, and creating pull requests in git repositories. It also provides utilities for managing file operations, database interactions, and more.

## File Descriptions

*   **`.npmignore`**: Specifies files and directories that should be ignored when publishing the package to npm.
*   **`eslint.config.mjs`**: Configuration file for ESLint, a JavaScript linter, extending a global configuration.
*   **`package.json`**: Defines the package metadata, dependencies, and scripts for the plugin.
*   **`schema.sql`**: SQL schema for creating database tables to store repository and code file information, including vector embeddings for semantic search.
*   **`src/actions/clone.ts`**: Implements the logic for cloning a GitHub repository, including saving repository and file information to the database.
*   **`src/actions/createPR.ts`**: Implements the logic for creating pull requests on a GitHub repository.
*   **`src/actions/createfile.ts`**: Implements the logic for creating a file with the provided content in a specified path.
*  **`src/actions/gendoc.ts`**: Implements the logic for generating documentation for code files based on the provided context.
*   **`src/actions/summarize.ts`**: Implements the logic for summarizing a GitHub repository, including its file structure and content.
*   **`src/actions/utils.ts`**: Provides utility functions for file system operations, such as getting file structures and loading file content.
*   **`src/constants.ts`**: Defines constants used within the plugin, specifically `GITHUB_CONSTANTS.REPO`.
*   **`src/index.ts`**: Entry point for the plugin, initializing the database and defining the plugin's actions.
*   **`src/repo_api.ts`**: Defines an Express router for exposing repository data via a REST API.
*   **`src/services/pg.ts`**: Implements a singleton class for managing PostgreSQL database connections.
*   **`src/utils.ts`**: Contains utility functions for the plugin, including extracting repo names and querying related code files.
*   **`tsconfig.json`**: TypeScript configuration file specifying compiler options for the project.
*   **`tsup.config.ts`**: Configuration file for tsup, a TypeScript bundler.

## Usage Instructions

### General
This plugin is intended to be used within the `eliza` framework. The plugin provides actions that can be triggered by user input via a chat interface, or internal logic.

### Specific Files:

*   **`src/actions/clone.ts`**:
    *   **Execution**: This file is not directly executable. It defines the `cloneRepoAction` which is triggered by the agent when a user requests to clone a repository.
    *   **Usage**: The action is triggered by user input containing a GitHub repository URL.
*   **`src/actions/createPR.ts`**:
    *   **Execution**: This file is not directly executable. It defines the `createPRAction` which is triggered by the agent when a user requests to create a pull request.
    *   **Usage**: The action is triggered by user input, it also requires context from memory that contains source repository information.
*   **`src/actions/createfile.ts`**:
    *   **Execution**: This file is not directly executable. It defines the `createFileAction` which is triggered by the agent when a user requests to create a file.
    *   **Usage**: The action is triggered by user input that contains file path and content information.
*   **`src/actions/gendoc.ts`**:
    *   **Execution**: This file is not directly executable. It defines the `gendocAction` which is triggered by the agent when a user requests to generate documentation for code.
    *   **Usage**: The action is triggered by user input that contains repository name and folder path information.
*   **`src/actions/summarize.ts`**:
    *   **Execution**: This file is not directly executable. It defines the `summarizeRepoAction` which is triggered by the agent when a user requests to summarize a repository.
    *   **Usage**: The action is triggered by user input, it also requires context from memory that contains the cloned repository information.
*   **`src/index.ts`**:
    *   **Execution**: This is the entry point of the plugin. It's not directly executed but is loaded by the `eliza` framework.
    *   **Usage**: This file initializes the database and registers all actions of this plugin with the `eliza` framework.
*   **`src/repo_api.ts`**:
    *   **Execution**: This file sets up an Express router, which is part of a larger web application (likely within `eliza`).
    *   **Usage**: The `/repos` endpoint can be accessed via HTTP GET to retrieve a list of repositories from the database.
*   **`src/services/pg.ts`**:
    *   **Execution**: Not directly executable. It's a singleton class used to manage database connections.
    *   **Usage**: Used internally by other files to interact with the PostgreSQL database.

## Dependencies

*   **`@ai16z/eliza`**: Framework for building AI agents.
*   **`express`**: Web framework for Node.js (used in `src/repo_api.ts`).
*   **`@octokit/rest`**: GitHub API client.
*   **`@octokit/types`**: Types for the Octokit client.
*    **`pg`**: PostgreSQL client for Node.js.
*   **`simple-git`**: Simple Git interface for Node.js.
*   **`tsup`**: TypeScript bundler.
*   **`typescript`**: TypeScript compiler.
*   **`eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-vitest`**: Linting and formatting tools.
*  ** `node` **: Node runtime environment
 *  ** `fs`, `path`, `crypto`,  `child_process`, `url`: Node core modules

## Additional Notes

*   The plugin relies on environment variables, specifically `POSTGRES_URL` and `GITHUB_API_TOKEN`.
*   The SQL schema in `schema.sql` includes a function for dynamically determining the vector embedding dimension based on configuration.
*   The plugin uses a PostgreSQL database to store repository and code file information, including vector embeddings for semantic search.
*   The plugin uses `tsup` to bundle the code, outputting ES modules to the `dist` directory.
*  The plugin is using `simple-git` to perform git operations.
*  The plugin uses `fs` module for file system operations.
*  The plugin uses `path` module for path manipulation.
*  The plugin uses `crypto` module for content hashing.
* The plugin is designed to be used within the `eliza` framework.
*  The `src/utils.ts` files contains helper functions to extract repository information from user messages by using LLM.
* The plugin uses `node-fetch` to make http calls.
* The plugin uses `child_process` to run git commands.
* The embedding dimension is set to 384 by default if no specific settings are provided.
* The plugin is using HNSW index for vector search.
* The plugin handles errors gracefully, logging them and providing feedback to the user via `elizaLogger` and callbacks.
*   The `/repos` endpoint in `src/repo_api.ts` can be used to retrieve a list of all repositories stored in the database.
 
source repo: /app/agent/.repos/sqrDAO/sqrAI