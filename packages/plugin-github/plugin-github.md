# `@sqrdao/plugin-github` README

## Introduction

This directory contains the source code for the `@sqrdao/plugin-github` npm package. This plugin provides GitHub integration functionalities for the Eliza framework, allowing interaction with GitHub repositories, including cloning, summarization, and code querying.


## File Descriptions

* **`.npmignore`**: Specifies files and directories to exclude from the npm package.
* **`eslint.config.mjs`**: Extends the global ESLint configuration for this package.
* **`package.json`**:  The npm package manifest file, containing metadata, dependencies, and scripts.
* **`schema.sql`**: SQL schema for PostgreSQL database tables (`repositories` and `code_files`) used to store repository and code file information, including embeddings.
* **`src/actions/clone.ts`**: Contains the `cloneRepoAction`, an Eliza action to clone a GitHub repository and save it to the database.  Includes functions to recursively get all files within a directory.
* **`src/actions/createPR.ts`**: Contains the `createPRAction`, an Eliza action to create a pull request on GitHub.
* **`src/actions/createfile.ts`**: Contains the `createFileAction`, an Eliza action to create a file in a specified path with given content.
* **`src/actions/gendoc.ts`**: Contains the `gendocAction`, an Eliza action to generate a README.md file from the code files in a given repository folder.
* **`src/actions/summarize.ts`**: Contains the `summarizeRepoAction`, an Eliza action to summarize a cloned GitHub repository.  Uses multiple calls to the LLM to refine the summary.
* **`src/constants.ts`**: Contains constants for the plugin.
* **`src/index.ts`**: The main entry point of the plugin, registering actions and initializing the database.  Also contains the `queryProjectAction` for retrieving information about a project.
* **`src/repo_api.ts`**: Defines an Express.js API route to fetch all repositories from the database.
* **`src/services/pg.ts`**: A singleton class for managing a PostgreSQL database connection pool.
* **`src/utils.ts`**: Contains utility functions, including file system operations and database queries.
* **`tsconfig.json`**: TypeScript compiler configuration.
* **`tsup.config.ts`**: tsup configuration for building the package.


## Usage Instructions

This plugin is designed to be used within the Eliza framework.  Individual actions can be triggered via the Eliza interface.  The `repo_api` provides a REST endpoint for external access.

To use the plugin:

1.  **Install Dependencies:** Ensure you have Node.js and npm (or yarn) installed. Install the necessary packages listed in `package.json`.
2.  **Set up Database:** Create a PostgreSQL database and configure the `POSTGRES_URL` environment variable. Run the schema file (`schema.sql`) to create the necessary tables.
3.  **Run the Plugin:**  Integrate the plugin into your Eliza agent setup.  The `initDB()` function in `src/index.ts` should be called to initialize the database connection.
4.  **Configure Environment Variables:** Set necessary environment variables like `GITHUB_API_TOKEN` and `GITHUB_PATH` (if needed).
5. **Trigger Actions:** Use Eliza's natural language interface or API to trigger the actions defined in `src/index.ts`.  For example, to clone a repository you might use a command like "Clone this repo: [github repo URL]".


## Dependencies

* `@ai16z/eliza`: The Eliza framework.
* `@types/express`: Type definitions for Express.js.
* `@octokit/rest`: GitHub REST API client.
* `@octokit/types`: Types for Octokit.
* `@types/pg`: Type definitions for pg (PostgreSQL client).
* `express`: Web framework for the REST API.
* `pg`: PostgreSQL client.
* `simple-git`:  A library for interacting with Git repositories.
* `tsup`: A faster bundler for TypeScript.
* `eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-vitest`, `typescript`: Development dependencies.


## Additional Notes

* The plugin uses embeddings for efficient code search.
* Error handling is implemented to catch and report issues during repository cloning and summarization.
* The plugin relies on the Eliza framework for natural language processing and memory management.
* The `GITHUB_PATH` environment variable can specify a subdirectory within the cloned repo to process.


## Input Files (Summary from file descriptions above)

The plugin processes various files to perform its actions.  These include: configuration files (`eslint.config.mjs`, `tsconfig.json`, `tsup.config.ts`), the database schema (`schema.sql`), and the TypeScript source code implementing the plugin's functionalities (`src/*.ts`).  Importantly, this plugin also processes code files from cloned GitHub repositories.