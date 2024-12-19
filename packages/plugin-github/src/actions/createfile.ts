import {
    Action,
    composeContext,
    elizaLogger,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    parseJSONObjectFromText,
    State,
} from "@ai16z/eliza";
import fs from "fs/promises";
import path from "path";

export const createFileAction: Action = {
    name: "CREATE_FILE",
    similes: ["CREATE_FILE", "CREATE_FILE_IN_FOLDER"],
    description: "Create a file with the provided content",
    validate: async (_runtime, _message) => {
        return true;
    },
    handler: async (runtime, message, state, _options, callback) => {
        elizaLogger.log("Creating a file action: ", message);
        // get repo and path from context
        const input = await getPathFileAndContentFromContext(
            runtime,
            message,
            state,
            _options,
            callback
        );
        const { filePath, content } = input;
        elizaLogger.log("File Path:", filePath);
        elizaLogger.log("Content:", content);

        // create the file with the provided content
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, "utf8");
        elizaLogger.log(`File created at ${filePath}`);
        return callback({
            text: `File created at ${filePath}`,
        });
    },
    examples: [],
};

export async function getPathFileAndContentFromContext(
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
): Promise<{ filePath: string; content: string }> {
    const contextTemplate = `
You are working on a chat with user, and you need to get pathfile and file content within it in order to create local file for user. You need the following information:
- Path to the file: Provide the path to the file where you want to create the content.
- Content: Provide the content that you want to write to the file.

---
Current context:
{{recentMessages}}
---
Response format should be formatted in JSON block like this: 
{ "content": "hello world", "filePath": "src/utils" }
`;
    const context2 = await composeContext({
        state: {
            ..._state,
        },
        template: contextTemplate,
    });
    const resultRepo = await generateText({
        runtime,
        context: context2,
        modelClass: "small",
    });
    const input = parseJSONObjectFromText(resultRepo);
    elizaLogger.log("Result:", input);
    if (!input.content) {
        callback({
            text: "Content is missing.",
        });
        return;
    }
    if (!input.filePath) {
        callback({
            text: "File path is missing.",
        });
        return;
    }
    return {
        filePath: input.filePath,
        content: input.content,
    };
}
