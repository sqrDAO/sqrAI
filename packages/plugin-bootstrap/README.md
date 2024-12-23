# @ai16z/plugin-bootstrap

## Introduction

This folder contains the `@ai16z/plugin-bootstrap` package, a plugin designed to provide a foundational set of actions, evaluators, and providers for AI agents built with the `@ai16z/eliza` library. It includes core functionalities such as managing conversation flow, extracting information, and updating goals.

## File Descriptions

-   **`.npmignore`**: Specifies files that should be ignored when publishing the package to npm.
-   **`eslint.config.mjs`**: Configuration file for ESLint, extending a global configuration.
-   **`package.json`**: Defines the package's metadata, dependencies, and scripts.
-   **`src/actions/continue.ts`**: Implements the `CONTINUE` action, allowing an agent to continue a thought or conversation thread.
-   **`src/actions/followRoom.ts`**: Implements the `FOLLOW_ROOM` action, enabling an agent to actively participate in a conversation.
-   **`src/actions/ignore.ts`**: Implements the `IGNORE` action, allowing an agent to cease interaction with a user or conversation.
-   **`src/actions/index.ts`**: Exports all action modules from the `actions` directory.
-   **`src/actions/muteRoom.ts`**: Implements the `MUTE_ROOM` action, allowing an agent to mute a room and stop responding unless explicitly mentioned.
-   **`src/actions/none.ts`**: Implements the `NONE` action, representing a default response without additional actions.
-  **`src/actions/unfollowRoom.ts`**: Implements the `UNFOLLOW_ROOM` action, enabling an agent to stop actively participating in a conversation but still respond if explicitly mentioned.
-   **`src/actions/unmuteRoom.ts`**: Implements the `UNMUTE_ROOM` action, allowing an agent to unmute a previously muted room.
-   **`src/evaluators/fact.ts`**: Implements the `GET_FACTS` evaluator, which extracts claims from conversations and stores them as facts.
-   **`src/evaluators/goal.ts`**: Implements the `UPDATE_GOAL` evaluator, which updates the status of goals based on conversation progress.
-   **`src/evaluators/index.ts`**: Exports all evaluator modules from the `evaluators` directory.
-   **`src/index.ts`**: The main entry point for the plugin, exporting all actions, evaluators and providers.
-   **`src/providers/boredom.ts`**: Implements the `boredomProvider`, which provides a boredom status message based on recent conversation data.
-  **`src/providers/facts.ts`**: Implements the `factsProvider`, which provides a list of key facts known to the agent.
-   **`src/providers/index.ts`**: Exports all provider modules from the `providers` directory.
-   **`src/providers/time.ts`**: Implements the `timeProvider`, which provides the current date and time in UTC.
-   **`tsconfig.json`**: Configuration file for TypeScript compilation.
-   **`tsup.config.ts`**: Configuration file for Tsup, a TypeScript bundler.

## Usage Instructions

### General
This plugin is intended to be used with `@ai16z/eliza`.  It provides actions, evaluators and providers that can be added to an agent's configuration.  See the `@ai16z/eliza` documentation for more details on how to use these.

### Specific Files

-   **`eslint.config.mjs`**: This file is not directly executed. It's used by ESLint for linting the project.
-   **`package.json`**: This file is not directly executed. It is used by npm to manage the project.
-   **`src/actions/*.ts`**: These files define actions that an AI agent can take. They are used programmatically by `@ai16z/eliza`.
-   **`src/evaluators/*.ts`**: These files define evaluators that analyze conversations and trigger actions. They are used programmatically by `@ai16z/eliza`.
-   **`src/providers/*.ts`**: These files define providers that provide information to the agent, such as the current time or facts. They are used programmatically by `@ai16z/eliza`.
-   **`src/index.ts`**: This is the main entry point of the plugin. Import it into your project to use the plugin.
- **`tsconfig.json`**: This is a configuration file for the TypeScript compiler, used during development and build processes. It's not directly executed.
- **`tsup.config.ts`**: This is a configuration file for the `tsup` bundler, used during the build process to bundle the TypeScript code. It's not directly executed.

**Example Usage (Conceptual):**
```typescript
import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";
import { Eliza } from "@ai16z/eliza";

const eliza = new Eliza({
    plugins: [bootstrapPlugin],
    // ...other configuration
});

// The eliza instance will now have access to the actions, evaluators and providers
// defined in this plugin.
```

## Dependencies

-   **@ai16z/eliza**: The core library for building AI agents.
-   **tsup**: A TypeScript bundler.
-  **whatwg-url**: A dependency of `@ai16z/eliza`

## Additional Notes

-   The `CONTINUE` action has a built-in mechanism to prevent excessive continuation messages.
-   The `FOLLOW_ROOM` and `MUTE_ROOM` actions rely on user state to function correctly.
-   The `factEvaluator` triggers periodically based on the conversation length.
- The `boredomProvider` uses a score to determine the boredom level of the agent, and the corresponding status message.
- The `timeProvider` provides the current time in UTC, which is important for bots interacting with users globally.
- The `examples` in each action and evaluator file are used for testing and documentation purposes.
-   The plugin is designed to be easily extensible, allowing for the addition of new actions, evaluators, and providers as needed.
-   The `tsup` bundler is configured to externalize certain dependencies like `dotenv`, `fs`, and `path`, which are not meant to be bundled with the plugin.
