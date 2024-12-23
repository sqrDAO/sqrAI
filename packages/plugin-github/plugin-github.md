# sqrAI Plugin - GitHub Integration

## Introduction

This folder contains the source code for a GitHub plugin designed to enhance the functionality of the sqrAI agent. It allows the agent to interact with GitHub repositories, including cloning, summarizing, querying, generating documentation, creating files and pull requests, and indexing code for better understanding.

## File Descriptions

*   **`.npmignore`**: Specifies files that should be ignored when publishing the package to npm.
*   **`eslint.config.mjs`**: Configuration file for ESLint, extending a global configuration.
*   **`package.json`**: Defines the package metadata, dependencies, and scripts for building and running the plugin.
*   **`schema.sql`**: SQL schema definition for creating tables related to repositories and code files in a PostgreSQL database, including an index for embeddings with HNSW.
*   **`src/actions/clone.ts`**: Contains the logic to clone a GitHub repository, index its files, and store metadata in the database.
*   **`src/actions/createPR.ts`**: Implements the action to create a pull request on GitHub using the Octokit library.
*   **`src/actions/createfile.ts`**: Defines the action for creating a file with specified content in a given path.
*   **`src/actions/gendoc.ts`**: Implements the action to generate documentation for code files within a specified repository and folder.
*   **`src/actions/summarize.ts`**: Contains the logic to summarize a GitHub repository, extracting key information about its structure and purpose.
*   **`src/actions/utils.ts`**: Provides utility functions for file system operations, like traversing directories and loading file contents.
*   **`src/constants.ts`**: Defines constants used within the plugin, such as repository identifiers.
*   **`src/index.ts`**: The main entry point for the plugin, registering actions, initializing the database, and integrating with Eliza framework components.
*   **`src/repo_api.ts`**: Defines an Express router to expose API endpoints for fetching repositories from the database.
*   **`src/services/pg.ts`**: Implements a singleton class for managing PostgreSQL database connections.
*   **`src/utils.ts`**: Provides utility functions for interacting with the database to get repository and code file information, as well as extracting repository names and owners from text.
*   **`tsconfig.json`**: Configuration file for TypeScript compiler settings for the plugin.
*   **`tsup.config.ts`**: Configuration file for Tsup, a bundler used to compile TypeScript code into JavaScript.

## Usage Instructions

### General
The plugin is designed to be integrated with the Eliza agent framework (from `@ai16z/eliza`). It exposes various actions that can be triggered based on user messages.

### Specific Files

*   **`src/actions/clone.ts`**:
    *   **Execution:** This file is not meant to be executed directly. It's used internally by the plugin when the `CLONE_REPO` action is called.
    *   **Usage:** The `cloneRepo` function can be called with a repository URL. The `cloneRepoAction` is used to register this functionality to an agent.
*  **`src/actions/createPR.ts`**:
    *   **Execution:** This file is not meant to be executed directly. It's used internally by the plugin when the `CREATE_PULL_REQUEST` action is called.
    *   **Usage:** The `createPRAction` is used to register this functionality to an agent. It requires a GitHub API token to be set.
*   **`src/actions/createfile.ts`**:
    *   **Execution:** This file is not meant to be executed directly. It's used internally by the plugin when the `CREATE_FILE` action is called.
    *   **Usage:** The `createFileAction` is used to register this functionality to an agent.
*   **`src/actions/gendoc.ts`**:
    *   **Execution:** This file is not meant to be executed directly. It's used internally by the plugin when the `GEN_DOC` action is called.
    *   **Usage:** The `gendocAction` is used to register this functionality to an agent.
*   **`src/actions/summarize.ts`**:
    *   **Execution:** This file is not meant to be executed directly. It's used internally by the plugin when the `SUMMARIZE_REPO` action is called.
    *  **Usage:** The `summarizeRepoAction` function can be called with a repository URL, and it will return a summary of that repo based on it's structure and some files content provided in parameter, or from knowledge base if available..
*  **`src/index.ts`**: 
    *  **Execution:** This file should be imported as a module into your Eliza agent setup, it also exports API router you can mount into your express server for getting data from database for example list of repositories cloned by agents.

## Dependencies

### Required Libraries:

*   **@ai16z/eliza**: Core framework for AI agents, provides necessary utilities and types.
*   **@types/express**: TypeScript definitions for Express.js, a web application framework for Node.js.
*   **express**: A web application framework for Node.js used to expose API routes.
*   **@octokit/rest**: GitHub REST API client for Node.js.
*   **@octokit/types**: TypeScript types for Octokit.
*  **@types/pg**: Type definitions for the PostgreSQL client library (`pg`).
*   **pg**: PostgreSQL client library for Node.js to interact with the database.
*   **simple-git**: A simple interface to Git, used to interact with Git repositories from node applications.
*    **tsup**: A bundler for TypeScript applications.
*   **fs**: Node's file system module, required for interacting with files and directories on system.
*   **path**: Node's path module, required for resolving paths and working with them in a platform-agnostic way. 
*   **uuid:** Package to generate universally unique identifiers (UUIDs).

### Tools:

*   **Node.js:** Runtime environment to execute JavaScript code (version >= 18 is recommended).
*   **npm or yarn:** Package managers are used to install dependencies and run scripts defined in `package.json`.

## Additional Notes

* This plugin assumes that a Postgres database is configured and available using the `POSTGRES_URL` env variable, that github api token is configured as `GITHUB_API_TOKEN` env variable and that your agent has rights to access local file system where it will clone git repositories into `.repos` folder in root path of execution directory, it can be changed by setting GITHUB_PATH env variable pointing to sub folder inside repo you want to index into DB..
 * The plugin uses vector embeddings generated by Eliza framework's embed function, make sure to configure embedding model correctly.
*   The plugin uses HNSW index for vector similarity searches.
* The plugin uses `tsup` to build the project, running `npm run build` will compile TypeScript and output it to `dist` folder.
* The plugin provides a set of actions that can be used by an agent, such as cloning a repository, summarizing it, generating documentation, creating files and PRs and querying its content.
* The plugin also provides a REST API for fetching repositories from the database.
* The plugin is designed to be modular and extensible, allowing for easy addition of new actions and features.

This README provides an overview of the project structure and functionality. For further details on specific components or configurations, please refer to the source code directly.
