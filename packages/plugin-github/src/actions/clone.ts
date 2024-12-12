import { Action, elizaLogger, embed, HandlerCallback, IAgentRuntime, Memory, State } from "@ai16z/eliza";
import fs from "fs";
import { spawn } from "child_process";

export type Repo = {
    url: string;
    name: string;
    owner: string;
    localPath: string;
};

export const cloneRepo = async (repoUrl: string):
    Promise<{ success: boolean; data?: string; error?: string; repo?: Repo }> => {
    try {
        elizaLogger.log("Cloning repo:", repoUrl);

        const repoName = repoUrl.split("/").pop();

        // we assume a working directory is set up for the agent
        // and the repository will be cloned into that directory
        const cloneDir = `/home/quangvn6/.eliza/github/${repoName}`;
        fs.mkdirSync(cloneDir, { recursive: true });

        const repo: Repo = {
            url: repoUrl,
            name: repoName,
            owner: repoUrl.split("/")[3],
            localPath: cloneDir,
        };

        // check if the repository is already cloned
        if (fs.existsSync(`${cloneDir}/.git`)) {
            elizaLogger.log("Repository already cloned");
            return {
                success: true,
                data: "Repository already cloned",
                repo
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

export const cloneRepoAction: Action = {
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
                return true;
            } else {
                callback({
                    text: `Failed to clone repository: ${result.error}`,
                    error: true,
                });
                return false;
            }
        } catch (error) {
            elizaLogger.error(`Failed to clone repository. Error: ${error}`);
            callback({
                text: `Failed to clone repository: ${error.message}`,
                error: true,
            });
            return false;
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
