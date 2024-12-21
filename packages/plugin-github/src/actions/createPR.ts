import {
    Action,
    elizaLogger,
    embed,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    parseJSONObjectFromText,
    State,
} from "@ai16z/eliza";
import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";

async function findRepoSource(runtime: IAgentRuntime, message: Memory) {
    const query = "Find Source Repo, example source: /path/to/repo";
    const embedding = await embed(runtime, query);

    const knowledge = await runtime.databaseAdapter.searchMemoriesByEmbedding(
        embedding,
        {
            tableName: "documents",
            roomId: message.roomId,
            agentId: runtime.agentId,
        }
    );
    if (knowledge.length === 0) {
        return null;
    }
    return knowledge[0];
}

async function createPRInfo(
    runtime: IAgentRuntime,
    message: Memory,
    repoSourcesKnowledge: Memory
) {
    const template = `
You are about to create a pull request from branch main to main in ${repoSourcesKnowledge.content.sourceRepo} to create an readme file for a service. Here are readme details:
${repoSourcesKnowledge.content.text}\n\n\n
You must generate for me a commit message, a title for the PR, and a description for the PR. Please provide them in the following JSON format:
{
    "repo": "${repoSourcesKnowledge.content.repoName}",
    "owner": "${repoSourcesKnowledge.content.owner}",
    "commitMessage": "Create readme file for service abc",
    "title": "Create a readme file for service abc",
    "description": "This PR creates a readme file for the service"
}`;
    const result = await generateText({
        runtime,
        context: template,
        modelClass: "small",
    });
    const output = parseJSONObjectFromText(result);
    elizaLogger.log("Result:", output);
    return output;
}

export const createPRAction: Action = {
    name: "CREATE_PULL_REQUEST",
    similes: ["CREATE_PULL_REQUEST", "CREATE_PR"],
    description: "Create a pull request",
    validate: async (_runtime, _message) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        const octokit = new Octokit({
            auth: runtime.getSetting("GITHUB_API_TOKEN"),
        });
        const {
            data: { login },
        } = await octokit.rest.users.getAuthenticated();
        console.log("Hello, %s", login);
        const repoSourcesKnowledge = await findRepoSource(runtime, message);
        const prDetail = await createPRInfo(
            runtime,
            message,
            repoSourcesKnowledge
        );
        console.log(prDetail);
        const git = simpleGit(repoSourcesKnowledge.content.sourceRepo);
        const currentBranch = (await git.status()).current;
        await git.add(".");
        await git.commit(prDetail.title);
        await git.push("origin", currentBranch);
        // Create PR
        const pr = await octokit.pulls.create({
            owner: prDetail.owner,
            repo: prDetail.repo,
            title: prDetail.title,
            body: prDetail.description,
            head: currentBranch,
            base: currentBranch,
        });

        return pr.data;
    },
    examples: [],
};
