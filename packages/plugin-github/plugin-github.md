# GitHub Plugin Package

## Introduction

This folder contains the source code for a GitHub plugin designed to integrate with an agent framework. It provides functionalities such as cloning repositories, summarizing them, generating documentation, creating files, and creating pull requests. The plugin interacts with GitHub through its API and uses a PostgreSQL database for persistent storage of repository and code file information.

## File Descriptions

*   **`.npmignore`**: Specifies files and directories that should be ignored when publishing the package to npm.
*   **`eslint.config.mjs`**: Configuration file for ESLint, extending a global ESLint configuration.
*   **`package.json`**: Defines the package's metadata, dependencies, and scripts for building, developing, and linting the project.
*   **`schema.sql`**: SQL schema definition for the PostgreSQL database, including tables for repositories and code files, along with indexes.
*   **`src/actions/clone.ts`**: Implements the action to clone a GitHub repository, including logic to handle existing clones and save repository information in the database.
*   **`src/actions/createPR.ts`**: Implements the action to create a pull request on GitHub, using `simple-git` and Octokit libraries.
*   **`src/actions/createfile.ts`**:  Implements the action to create a file in a given directory with the specified content.
*   **`src/actions/gendoc.ts`**: Implements the action to generate documentation for code in a specified repository and folder path.
*   **`src/actions/summarize.ts`**: Implements the action to summarize a cloned GitHub repository, extracting information about programming languages, frameworks, and documentation.
*    **`src/actions/utils.ts`**: Utility functions for file system operations, such as getting file structure, converting it to text and loading file contents.
*   **`src/constants.ts`**: Defines constants used throughout the plugin.
*   **`src/index.ts`**: The main entry point of the plugin, which defines the plugin's name, description, and actions. It also sets up database connections and initializes the database schema.
*   **`src/repo_api.ts`**: Defines an Express API endpoint to retrieve all repositories from the database.
*   **`src/services/pg.ts`**: Implements a singleton class for managing PostgreSQL database connections and queries.
*   **`src/utils.ts`**: Provides utility functions for extracting repository names and owners, querying repositories and related code files from the database.
*   **`tsconfig.json`**: TypeScript configuration file specifying compiler options and source/output directories.
*   **`tsup.config.ts`**: Configuration file for the `tsup` bundler used to compile TypeScript code into JavaScript.

## Usage Instructions

### General Setup

1.  Ensure you have Node.js and npm installed.
2.  Install project dependencies by running `npm install` in the `packages/plugin-github` directory.
3.  Set up a PostgreSQL database and configure the connection string using the `POSTGRES_URL` environment variable.
4.  Set up a Github API token and set it as `GITHUB_API_TOKEN` environment variable.

### Running Specific Files

*   **`src/index.ts`**: This is the entry point for the plugin, and it's not meant to be run directly. It is used by the agent framework.
*   **`src/actions/clone.ts`**: This file exports functions to be used by other parts of the system, specifically through the `cloneRepoAction` in `src/index.ts`.  It is invoked by the agent when using clone commands.

    *   **Usage (through agent)**: Send a message containing a GitHub repository URL to the agent, which will trigger the `CLONE_REPO` action. For example: "Clone this repository: https://github.com/owner/repo".
*   **`src/actions/createPR.ts`**: This file exports functions to be used by other parts of the system, specifically through the `createPRAction` in `src/index.ts`. It is invoked by the agent when using create PR commands.

    *   **Usage (through agent)**: Send a message to the agent requesting a pull request, which will trigger the `CREATE_PULL_REQUEST` action. For example: "Create a pull request".
*   **`src/actions/createfile.ts`**: This file exports functions to be used by other parts of the system, specifically through the `createFileAction` in `src/index.ts`. It is invoked by the agent when using create file commands.

    *   **Usage (through agent)**: Send a message to the agent requesting to create a file, which will trigger the `CREATE_FILE` action. For example: "Create file in folder /path/to/folder with content: Hello, World!".
*   **`src/actions/gendoc.ts`**: This file exports functions to be used by other parts of the system, specifically through the `gendocAction` in `src/index.ts`. It is invoked by the agent when using generate documentation commands.

    *   **Usage (through agent)**: Send a message to the agent requesting to generate documentation, which will trigger the `GEN_DOC` action. For example: "Generate documentation for code in repository project-management-tool and folder src/utils".
*   **`src/actions/summarize.ts`**: This file exports functions to be used by other parts of the system, specifically through the `summarizeRepoAction` in `src/index.ts`. It is invoked by the agent when using summarize repo commands.

    *   **Usage (through agent)**: Send a message to the agent requesting a repository summarization, which will trigger the `SUMMARIZE_REPO` action. For example: "Summarize this repository".
*   **`src/repo_api.ts`**: This file sets up an API endpoint to retrieve repositories.

    *   **Usage**: Start the application with `npm run dev` and send a GET request to `/repos` to retrieve all repositories.

### Building the plugin
*   Run `npm run build` to compile the Typescript code into Javascript.

## Dependencies

*   **Node.js**: Required to run JavaScript code and use npm.
*   **npm**: Package manager for installing dependencies.
*   **TypeScript**:  Used for writing type-safe code.
*   **`@ai16z/eliza`**: Core framework library for the agent.
*   **`express`**: Web framework for creating the API endpoint.
*   **`@octokit/rest`**: GitHub API client library.
*   **`@octokit/types`**: Typescript types for the Octokit library.
*   **`pg`**: PostgreSQL client library.
*   **`simple-git`**: Library for interacting with Git repositories.
*   **`tsup`**: TypeScript bundler for building the plugin.
*   **`eslint`**: Linter for JavaScript and TypeScript code.
*   **`eslint-config-prettier`**: ESLint configuration for Prettier.
*   **`eslint-plugin-prettier`**: ESLint plugin for Prettier.
*   **`eslint-plugin-vitest`**: ESLint plugin for Vitest.
*   **`typescript`**: TypeScript compiler.
*   **`dotenv`**: For managing environment variables.

## Additional Notes

*   The plugin is designed to be used within the context of an agent framework, specifically `@ai16z/eliza`.
*   Ensure that the PostgreSQL database is running and accessible.
*   The plugin uses environment variables for configuration, such as `POSTGRES_URL` and `GITHUB_API_TOKEN`.
*   The `schema.sql` file is used to create the necessary tables in the database.
*   The plugin utilizes vector embeddings for similarity search of code files based on user queries.
*   The plugin uses a combination of language models and local file system operations to achieve its functionality.
*   The `src/actions/summarize.ts` includes the ability to generate a summary of a repository's purpose, usage and target users by analyzing its files and structure.
*   The `src/actions/gendoc.ts` generates documentation for code files in markdown format.
*   The `src/actions/createfile.ts` creates files with content extracted from user messages or other information sources.
*   The `src/actions/createPR.ts` uses simple git and Octokit to create pull requests on GitHub repositories.
 
 source repo: /app/agent/.repos/sqrDAO/sqrAI