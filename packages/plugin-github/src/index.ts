import { elizaLogger, embed, MemoryManager, parseJSONObjectFromText } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import fs from "fs";
import { spawn } from "child_process";
import { GITHUB_CONSTANTS } from "./constants";
import path from "path";
import { generateText } from "@ai16z/eliza"; // Assuming generateText is a function from the eliza package

export type Repo = {
    url: string;
    name: string;
    owner: string;
    localPath: string;
};

const cloneRepo = async (repoUrl: string):
    Promise<{ success: boolean; data?: string; error?: string; repo?: Repo }> => {
    try {
        elizaLogger.log("Cloning repo:", repoUrl);

        const repoName = repoUrl.split("/").pop();

        // we assume a working directory is set up for the agent
        // and the repository will be cloned into that directory
        const cloneDir = `/tmp/eliza/github/${repoName}`;
        fs.mkdirSync(cloneDir, { recursive: true });

        // check if the repository is already cloned
        if (fs.existsSync(`${cloneDir}/.git`)) {
            elizaLogger.log("Repository already cloned");
            return {
                success: true,
                data: "Repository already cloned",
            };
        }

        // Clone the repository
        const cloneProcess = spawn("git", ["clone", repoUrl, cloneDir]);

        // Wait for the process to finish
        await new Promise((resolve, reject) => {
            cloneProcess.on("close", (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`git clone failed with code ${code}`));
                }
            });
        });

        // assert the repository was cloned successfully
        if (!fs.existsSync(cloneDir)) {
            return {
                success: false,
                error: "Failed to clone repository",
            }
        }

        const repo: Repo = {
            url: repoUrl,
            name: repoName,
            owner: repoUrl.split("/")[3],
            localPath: cloneDir,
        };

        return {
            success: true,
            data: `Repository cloned successfully at ${cloneDir}`,
            repo
        };
    } catch (error) {
        elizaLogger.error("Failed to clone repo:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred",
        };
    }
};

const getFileStructure = (dir: string, fileList: string[] = []) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFileStructure(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
};

const convertFileStructureToText = (fileList: string[]) => {
    return fileList.map(file => path.relative("/tmp/eliza/github", file)).join("\n");
};

const loadFiles = (repoPath: string, files: string[]) => {
    return files.map(file => ({
        path: file,
        content: fs.readFileSync(path.join(repoPath, file), 'utf-8')
    }));
};

const summarizeRepo = async (repoPath: string, runtime: IAgentRuntime, message: Memory) => {
    elizaLogger.log("Message:", message);
    try {
        const fileList = getFileStructure(repoPath);
        const fileStructureText = convertFileStructureToText(fileList);

        const context = `
            Here is the file structure of a GitHub repository:
            ${fileStructureText}
            
            TASK: extract the following information:
            - Programming language(s)
            - Framework(s)
            - Documentation files
            - Other potential important files

            Answer in JSON format string. For example:
            \`\`\`json
            {
                "programmingLanguages": ["Python", "JavaScript"],
                "frameworks": ["React", "Flask"],
                "documentationFiles": ["README.md"],
                "importantFiles": ["config.json", "Dockerfile", "requirements.txt", "package.json"]     
            }
            \`\`\`
            Keep the response short, do not list everything, only list the important ones.
            
            Additional context from user's message: ${message.content.text}
        `;

        const summary = await generateText({
            runtime,
            context,
            modelClass: "small",
        });

        elizaLogger.log("Summary:", summary);
        const parsedSummary = parseJSONObjectFromText(summary);

        return {
            success: true,
            data: parsedSummary,
        };
    } catch (error) {
        elizaLogger.error("Failed to summarize repo:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred",
        };
    }
};

const generateRepoSummary = async (repo: Repo, runtime: IAgentRuntime, message: Memory, files: string[]) => {
    elizaLogger.log("Generating repository summary:", message);
    try {
        const importantFiles = loadFiles(repo.localPath, files);

        const context = `
            Here is the file structure of a GitHub repository:
           
            ${importantFiles.map(file => `File: ${file.path}\nContent:\n${file.content}`).join('\n\n')}
            
            TASK: extract the following information:
            - What is this repository about
            - How this was supposed to be used
            - Who are the targeted users
            - Why this repo was made

            Here are some important files:
            ${importantFiles.map(file => `File: ${file.path}\nContent:\n${file.content}`).join('\n\n')}

            Answer in JSON format string. For example:
            \`\`\`json
            {
                "about": "This repository is about...",
                "usage": "This repository is supposed to be used for...",
                "targetedUsers": ["Developers", "Researchers"],
                "purpose": "This repository was made to..."
            }
            \`\`\`
            Keep the response concise and to the point, from 100 to 200 words.
            
            Additional context from user's message: ${message.content.text}
        `;

        const summary = await generateText({
            runtime,
            context,
            modelClass: "small",
        });

        elizaLogger.log("Summary:", summary);
        const parsedSummary = parseJSONObjectFromText(summary);

        return {
            success: true,
            data: parsedSummary,
        };
    } catch (error) {
        elizaLogger.error("Failed to generate repository summary:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred",
        };
    }
};

const cloneRepoAction: Action = {
    name: "CLONE_REPO",
    similes: [
        "REPO_CLONE",
        "CLONE_REPOSITORY",
        "REPOSITORY_CLONE",
        "COPY_REPO",
        "REPO_COPY",
        "DUPLICATE_REPO",
        "REPO_DUPLICATE",
        "GIT_CLONE",
        "CLONE_GIT_REPO",
    ],
    description: "Clone a GitHub repository",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating clone repo request");
        // TODO: what should we verify before clone a repo?
        // For example, we could check if the user has the necessary permissions
        // to clone the repository.
        // We could also check if the local folder where the repository will be cloned exists.
        return true
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Github Repository clone request: ", message);

        // Get the repository URL from the message using regex
        const repoUrl = message.content.text.match(
            'https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?'
        );

        elizaLogger.log("Repo URL:", repoUrl);

        if (!repoUrl || repoUrl.length < 1) {
            callback({
                text: "Could you please provide a valid GitHub repository URL?",
            });
            return;
        }

        elizaLogger.log("Cloning Repo:", repoUrl[0]);

        callback({
            text: `I'll clone the repository at ${repoUrl[0]}`,
        });

        try {
            const result = await cloneRepo(repoUrl[0]);
            let embedding = []
            if (result.success) {
                embedding = await embed(runtime, `Successfully cloned repository: ${repoUrl[0]} at ${result.repo.localPath}`);
            }

            await runtime.knowledgeManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                roomId: message.roomId,
                embedding,

                content: {
                    text: result.data || result.error,
                    action: "CLONE_REPO",
                    repo: result.repo,
                }
            });

            if (result.success) {
                callback({
                    text: "Repository cloned successfully",
                });
            } else {
                callback({
                    text: `Failed to clone repository: ${result.error}`,
                    error: true,
                });
            }
        } catch (error) {
            elizaLogger.error(`Failed to clone repository. Error: ${error}`);
            callback({
                text: `Failed to clone repository: ${error.message}`,
                error: true,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Clone this repository: https://github.com/ai16z/eliza" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll clone the repository at https://github.com/ai16z/eliza",
                    action: "CLONE_REPO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you clone this repository: https://github.com/ai16z/eliza",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll clone the repository at https://github.com/ai16z/eliza",
                    action: "CLONE_REPO",
                },
            },
        ],
    ],
} as Action;

const summarizeRepoAction: Action = {
    name: "SUMMARIZE_REPO",
    similes: [
        "REPO_SUMMARY",
        "SUMMARIZE_REPOSITORY",
        "REPOSITORY_SUMMARY",
        "GIT_SUMMARY",
        "SUMMARIZE_GIT_REPO",
    ],
    description: "Summarize or improve a summarization of a cloned GitHub repository",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating summarize repo request");
        // TODO: what should we verify before summarizing a repo?
        // For example, we could check if the repository has been cloned.
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Github Repository summarize request: ", message);

        const embedding = await embed(runtime, message.content.text);

        // Query the local path from memory
        const memory = await runtime.knowledgeManager.searchMemoriesByEmbedding(embedding, {
            roomId: message.roomId,
        });

        const repoMemory = memory.find((m) => m.content.action === "CLONE_REPO");
        const repo = repoMemory?.content.repo as Repo;

        if (!repo) {
            callback({
                text: "Repository not found. Please confirm the repository.",
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

        elizaLogger.log("Summarizing Repo:", repoPath);

        callback({
            text: `I'll summarize the repository at ${repoPath}`,
        });

        try {
            const result = await summarizeRepo(repoPath, runtime, message);
            if (!result.success) {
                callback({
                    text: `Failed to summarize repository: ${result.error}`,
                    error: true,
                });
                return;
            }

            // const summaryText = `Summary of the repository ${repo.name}: ${JSON.stringify(result.data)}`; 
            // const summaryEmbedding = await embed(runtime, summaryText);

            // await runtime.knowledgeManager.createMemory({
            //     userId: message.userId,
            //     agentId: message.agentId,
            //     roomId: message.roomId,
            //     embedding: summaryEmbedding,
            //     content: {
            //         text: summaryText,
            //         action: "SUMMARIZE_REPO",
            //         repo,
            //         summary: result.data
            //     }
            // });

            if (result.success) {
                callback({
                    text: "Repository summarized successfully",
                });
            } else {
                callback({
                    text: `Failed to summarize repository: ${result.error}`,
                    error: true,
                });
            }

            const contentSummaryResult = await generateRepoSummary(repo, runtime, message, result.data.importantFiles);

            if (!contentSummaryResult.success) {
                callback({
                    text: `Failed to generate repository summary: ${contentSummaryResult.error}`,
                    error: true,
                });
                return;
            }

            const contentSummaryText = `Summary of the repository ${repo.name}: ${JSON.stringify(contentSummaryResult.data)}`;
            const contentSummaryEmbedding = await embed(runtime, contentSummaryText);

            await runtime.knowledgeManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                roomId: message.roomId,
                embedding: contentSummaryEmbedding,
                content: {
                    text: contentSummaryText,
                    action: "SUMMARIZE_REPO",
                    repo,
                    summary: result.data
                }
            });
        } catch (error) {
            elizaLogger.error(`Failed to summarize repository. Error: ${error}`);
            callback({
                text: `Failed to summarize repository: ${error.message}`,
                error: true,
            });
        }
    },
    examples: [

    ],
} as Action;

export const githubPlugin: Plugin = {
    name: "githubPlugin",
    description: "Plugin for GitHub integration",
    actions: [cloneRepoAction, summarizeRepoAction],
    evaluators: [],
    providers: [],
};
