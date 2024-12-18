import {
    booleanFooter,
    elizaLogger,
    embed,
    parseBooleanFromText,
    parseJSONObjectFromText,
    parseJsonArrayFromText,
    stringArrayFooter,
} from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import fs from "fs";
import path from "path";
import { generateText } from "@ai16z/eliza"; // Assuming generateText is a function from the eliza package
import { cloneRepoAction, Repo } from "./actions/clone";
import { getFileStructure, loadFiles } from "./actions/utils";
import { summarizeRepoAction } from "./actions/summarize";
import PostgresSingleton from "./services/pg";
import { fileURLToPath } from "url";
import { extractRepoNameAndOwner, getRepoByNameAndOwner, queryRelatedCodeFiles } from "./utils"; // Assuming extractRepoNameAndOwner and getRepoByNameAndOwner are functions from the utils

const queryProjectAction: Action = {
    name: "EXPLAIN_PROJECT",
    similes: [
        "WHAT_IS_PROJECT",
        "HOW_TO_USE",
        "HOW_TO_BUILD",
        "SEARCH_PROJECT",
        "EXPLAIN_CODE",
        "EXPLAIN_PROJECT",
    ],
    description:
        "Explain how a project works or provide information such as usage or purpose of a project",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating query project request");
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Explain project request: ", message);

        const { name: repoName, owner } = await extractRepoNameAndOwner(runtime, message.content.text);
        if (!repoName || !owner) {
            callback({
                text: "I couldn't extract the repository name or owner. Could you please provide the repository details?",
            });
            return;
        }

        const repo = await getRepoByNameAndOwner(repoName, owner);
        if (!repo) {
            callback({
                text: "I couldn't find the repository in the database. Could you please confirm the repository details?",
            });
            return;
        }

        const repoPath = repo.localPath;

        elizaLogger.log("Repo Path:", repoPath);

        if (!repoPath) {
            callback({
                text: "Could you please provide a valid local path to the cloned repository?",
            });
            return;
        }

        elizaLogger.log("Querying Project:", repoPath);

        callback({
            text: `I'll look into the project at ${repoPath} and gather the necessary information.`,
        });

        let attempts = 0;
        let sufficientKnowledge = false;

        let questionEmbedding = await embed(runtime, message.content.text);
        const checkedFiles: { relativePath: string }[] = await queryRelatedCodeFiles(runtime, repo.id, questionEmbedding);

        while (attempts < 2 && !sufficientKnowledge) {
            elizaLogger.log("Related files:", checkedFiles);
            attempts++;

            if (checkedFiles.length > 0) {
                const fileContents = await Promise.all(
                    checkedFiles.map(async (file) => {
                        try {
                            const content = await fs.promises.readFile(path.join(repoPath, file.relativePath), "utf-8");
                            return { relativePath: file.relativePath, content };
                        } catch (error) {
                            elizaLogger.error(`Error reading file ${file.relativePath}:`, error);
                            return { relativePath: file.relativePath, content: "Error reading file" };
                        }
                    })
                );

                const context =
                    `
                    Here is the existing knowledge about the project:
                    ${fileContents.map((file) => `Path: ${file.relativePath}\nContent: ${file.content}`).join("\n\n")}
                    
                    TASK: Determine if the existing knowledge is sufficient to answer the following question:
                    ${message.content.text}
                ` + booleanFooter;

                const response = await generateText({
                    runtime,
                    context,
                    modelClass: "small",
                });

                elizaLogger.log(`Sufficient Knowledge Response: "${response.trim()}" - ${parseBooleanFromText(response.trim())}`);

                // answer anyway
                if (parseBooleanFromText(response.trim())) {
                    callback({
                        text: `I found sufficient information: ${fileContents[0].content}`,
                    });
                    sufficientKnowledge = true;
                    const context = `
                        Here is the existing knowledge about the project:
                        ${fileContents.map((file) => `Path: ${file.relativePath}\nContent: ${file.content}`).join("\n\n")}
                        
                        TASK: Answer the following question:
                        ${message.content.text}

                        Answer clearly and concisely. Provide references to files or code snippets if necessary.
                        Code block formatting is supported.
                    `;

                    const answer = await generateText({
                        runtime,
                        context,
                        modelClass: "small",
                    });

                    callback({
                        text: answer,
                    });

                    return true;
                }
            }

            const fileList = getFileStructure(repoPath, 3, repoPath);
            elizaLogger.log("File List:", fileList);
            const unreadFiles = fileList.filter(
                (file) => !checkedFiles.some((f) => f.relativePath === file)
            );

            const filesRespond = await generateText({
                runtime,
                context:
                    `
                    Determine up to 5 files to read to gather more information about the project.
                    The file should contain information that can help answer the question:
                    ${message.content.text}
                    ---
                    List of potential files:
                    ${unreadFiles.join("\n")}
                    ---
                    List of files already checked:
                    ${checkedFiles.join("\n")}
                ` + stringArrayFooter,
                modelClass: "small",
            });

            const filesToRead = parseJsonArrayFromText(filesRespond);
            elizaLogger.log("Files to Read:", filesToRead);
            callback({
                text: `I'll read the following files to gather more information: ${filesToRead.join(", ")}`,
            });
            checkedFiles.push(...filesToRead.map((file) => ({ relativePath: file })))
        }

        if (!sufficientKnowledge) {
            callback({
                text: "I couldn't gather enough information after multiple attempts.",
                error: true,
            });
            return false;
        }

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What is the purpose of this project?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll look into the project to find out.",
                    action: "QUERY_PROJECT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How to use this project to build a web application?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll look into the project to find out.",
                    action: "HOW_TO_USE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Can you explain the project structure?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll look into the project to find out.",
                    action: "EXPLAIN_PROJECT",
                },
            },
        ],
    ],
} as Action;

let pgClient = null;
export async function initDB() {
    pgClient = await PostgresSingleton.getInstance().getClient();

    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory

    const githubSchema = fs.readFileSync(
        path.resolve(__dirname, "../schema.sql"),
        "utf8"
    );
    pgClient.query(githubSchema);
}

initDB().then(() => console.log("create db success"));
export const githubPlugin: Plugin = {
    name: "githubPlugin",
    description: "Plugin for GitHub integration",
    actions: [cloneRepoAction, summarizeRepoAction, queryProjectAction],
    evaluators: [],
    providers: [],
};
