import {
    booleanFooter,
    elizaLogger,
    embed,
    parseBooleanFromText,
    parseJSONObjectFromText,
    parseJsonArrayFromText,
    stringArrayFooter
} from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import { generateText } from "@ai16z/eliza"; // Assuming generateText is a function from the eliza package
import { cloneRepoAction, Repo } from "./actions/clone";
import { getFileStructure, loadFiles } from "./actions/utils";
import { summarizeRepoAction } from "./actions/summarize";
import { elysiumTestnet } from "viem/chains";

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
    description: "Explain how a project works or provide information such as usage or purpose of a project",
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

        const embedding = await embed(runtime, message.content.text);

        // Query the local path from memory
        // const memory = await runtime.knowledgeManager.searchMemoriesByEmbedding(embedding, {
        //     roomId: message.roomId,
        // });

        const memory = [await runtime.knowledgeManager.getMemoryById("f6de09a2-4b7c-44d7-bc58-c983ad69e9b1")];

        const repoMemory = memory.find((m) => m.content.action === "CLONE_REPO");
        const repo = repoMemory?.content.repo as Repo;

        if (!repo) {
            callback({
                text: "I couldn't find the repository. Could you please confirm the repository details?",
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

        const checkedFiles: string[] = [];

        while (attempts < 1 && !sufficientKnowledge) {
            attempts++;

            // get top-5 related knowledge
            const knowledge = await runtime.knowledgeManager.searchMemoriesByEmbedding(
                embedding,
                {
                    roomId: message.roomId,
                    count: 5,
                });

            elizaLogger.log("Existing Knowledge:", knowledge);

            knowledge.forEach((k) => {
                const parsedContent = parseJSONObjectFromText(k.content.text);
                if (parsedContent && parsedContent.path && !checkedFiles.includes(parsedContent.path)) {
                    checkedFiles.push(parsedContent.path);
                }
            });
            elizaLogger.log("Checked Files:", checkedFiles);

            if (knowledge.length > 0) {
                const context = `
                    Here is the existing knowledge about the project:
                    ${knowledge.map(k => k.content.text).join('\n')}
                    
                    TASK: Determine if the existing knowledge is sufficient to answer the following question:
                    ${message.content.text}
                ` + booleanFooter;

                const response = await generateText({
                    runtime,
                    context,
                    modelClass: "small",
                });

                elizaLogger.log("Sufficient Knowledge Response:", response);

                // answer anyway
                if (parseBooleanFromText(response)) {
                    callback({
                        text: `I found sufficient information: ${knowledge[0].content.text}`,
                    });
                    sufficientKnowledge = true;
                    const context = `
                        Here is the existing knowledge about the project:
                        ${knowledge.map(k => k.content.text).join('\n')}
                        
                        TASK: Answer the following question:
                        ${message.content.text}

                        Answer clearly and concisely. Provide references to files or code snippets if necessary.
                    `

                    const answer = await generateText({
                        runtime,
                        context,
                        modelClass: "small",
                    });

                    callback({
                        text: answer
                    })

                    return true;
                }
            }

            const fileList = getFileStructure(repoPath, 3);
            elizaLogger.log("File List:", fileList);
            const unreadFiles = fileList.filter(file => !checkedFiles.some(f => f === file));

            const filesRespond = await generateText({
                runtime,
                context: `
                    Determine up to 5 files to read to gather more information about the project.
                    The file should contain information that can help answer the question:
                    ${message.content.text}
                    ---
                    List of potential files:
                    ${unreadFiles.join('\n')}
                    ---
                    List of files already checked:
                    ${checkedFiles.join('\n')}
                ` + stringArrayFooter,
                modelClass: "small",
            });

            const filesToRead = parseJsonArrayFromText(filesRespond);
            elizaLogger.log("Files to Read:", filesToRead);
            callback({
                text: `I'll read the following files to gather more information: ${filesToRead.join(", ")}`,
            });

            // Read these files and store their embedding
            // no need repoPath as getFileStructure will return full path
            const filesContent = loadFiles('', filesToRead);
            for (const file of filesContent) {
                checkedFiles.push(file.path);
                if (!file.content) {
                    continue;
                }
                const embedding = await embed(runtime,
                    `
                    Project: ${repo.owner}\\${repo.name}\n
                    Path: ${file.path}\n
                    Content: ${file.content}
                    `
                );
                await runtime.knowledgeManager.createMemory({
                    userId: message.userId,
                    agentId: message.agentId,
                    roomId: message.roomId,
                    unique: true,
                    embedding,
                    content: {
                        text: file.content,
                        path: file.path,
                        action: "READ_FILE",
                    },
                });
            }
        }

        if (!sufficientKnowledge) {
            callback({
                text: "I couldn't gather enough information after multiple attempts.",
                error: true,
            });
            return false
        }

        return true
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
                content: { text: "How to use this project to build a web application?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll look into the project to find out.",
                    action: "HOW_TO_USE",
                }
            }
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
                }
            }
        ]
    ],
} as Action;

export const githubPlugin: Plugin = {
    name: "githubPlugin",
    description: "Plugin for GitHub integration",
    actions: [cloneRepoAction, summarizeRepoAction, queryProjectAction],
    evaluators: [],
    providers: [],
};
