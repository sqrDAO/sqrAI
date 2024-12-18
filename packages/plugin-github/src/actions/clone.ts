import {
    Action,
    elizaLogger,
    embed,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    stringToUuid,
} from "@ai16z/eliza";
import fs from "fs";
import { glob } from "glob";
import { spawn } from "child_process";
import path from "path";
import PostgresSingleton from "../services/pg";
import { v4 } from "uuid";
import { createHash } from "crypto";

export type Repo = {
    url: string;
    name: string;
    owner: string;
    localPath: string;
};

const pgClient = await PostgresSingleton.getInstance().getClient();

export const cloneRepo = async (
    repoUrl: string
): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    repo?: Repo;
}> => {
    try {
        elizaLogger.log("Cloning repo:", repoUrl);

        const parts = repoUrl.split("/");
        if (parts.length < 2) {
            throw Error("Invalid  github URL structure");
        }
        const owner = parts[parts.length - 2];
        const repoName = parts[parts.length - 1];

        const repoPath = path.join(process.cwd(), ".repos", owner, repoName);

        // we assume a working directory is set up for the agent
        // and the repository will be cloned into that directory
        const cloneDir = repoPath;
        fs.mkdirSync(cloneDir, { recursive: true });

        const repo: Repo = {
            url: repoUrl,
            name: repoName,
            owner: owner,
            localPath: cloneDir,
        };

        // check if the repository is already cloned
        if (fs.existsSync(`${cloneDir}/.git`)) {
            elizaLogger.log("Repository already cloned");
            return {
                success: true,
                data: "Repository already cloned",
                repo,
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
            };
        }

        return {
            success: true,
            data: `Repository cloned successfully at ${cloneDir}`,
            repo,
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
        return true;
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
            "https://github.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?"
        );

        elizaLogger.log("Repo URL:", repoUrl);

        if (!repoUrl || repoUrl.length < 1) {
            await callback({
                text: "Could you please provide a valid GitHub repository URL?",
            });
            return;
        }

        elizaLogger.log("Cloning Repo:", repoUrl[0]);

        await callback({
            text: `I'll clone the repository at ${repoUrl[0]}`,
        });

        try {
            const result = await cloneRepo(repoUrl[0]);

            // if clone success, then create embedding from files in repo
            if (result.success) {
                await saveRepoToDatabase(result, runtime);
            }

            if (result.success) {
                await callback({
                    text: "Repository cloned successfully",
                });
                return true;
            } else {
                await callback({
                    text: `Failed to clone repository: ${result.error}`,
                    error: true,
                });
                return false;
            }
        } catch (error) {
            elizaLogger.error(`Failed to clone repository. Error: ${error}`);
            await callback({
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
                content: {
                    text: "Clone this repository: https://github.com/ai16z/eliza",
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

async function saveRepoToDatabase(result, runtime: IAgentRuntime) {
    // get files by path
    const envPath = runtime.getSetting("GITHUB_PATH") as string;
    const searchPath = envPath
        ? path.join(result.repo.localPath, envPath, "**/*")
        : path.join(result.repo.localPath, "**/*");
    // const searchPath = path.join(result.repo.localPath, "**/*");
    const files = await glob(searchPath, { nodir: true });
    const newRepo = await pgClient.query(
        `INSERT INTO repositories(id, name, "localPath", owner, description) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [
            v4(),
            result.repo.name,
            result.repo.localPath,
            result.repo.owner,
            result.repo.url,
        ]
    );
    for (const file of files) {
        const relativePath = path.relative(result.repo.localPath, file);
        const content = await fs.promises.readFile(file, "utf-8");
        const contentHash = createHash("sha256").update(content).digest("hex");

        const codeFileId = stringToUuid(
            `github-${result.repo.owner}-${result.repo.name}-${relativePath}`
        );
        const foundFile = await pgClient.query(
            "SELECT * FROM repositories WHERE id = $1",
            [codeFileId]
        );
        if (
            foundFile.rows.length > 0 &&
            foundFile.rows[0].contentHash === contentHash
        ) {
            continue;
        }

        const embedding = await embed(runtime, content);
        await pgClient.query(
            `INSERT INTO code_files(id, "repositoryId", "name", "relativePath", "embedding", "contentHash") VALUES ( $1, $2, $3, $4, $5, $6)`,
            [
                codeFileId,
                newRepo.rows[0].id,
                path.basename(file),
                relativePath,
                `[${embedding.join(",")}]`,
                contentHash,
            ]
        );
    }
}
