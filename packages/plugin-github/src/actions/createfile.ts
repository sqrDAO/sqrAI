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
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Creating a file action: ", message);
        // get repo and path from context

        const knowledgeDocument = await runtime.databaseAdapter.getMemories({
            roomId: message.roomId as `${string}-${string}-${string}-${string}-${string}`,
            tableName: "documents",
            agentId: runtime.agentId,
        });
        const contextDocument = knowledgeDocument
            .map(
                (doc) =>
                    `source folder: ${doc.content.source} \n content: ${doc.content.text} \n source repo: ${doc.content.sourceRepo}`
            )
            .join("\n");
        state.contextDocument = contextDocument;
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
You are working in a conversational context with a user. Your task is to extract and format information necessary to create a local file based on the user's input. To achieve this, look for the following details in the conversation:

1. **Path to the File**: The directory or file path where the user wants the file to be created. Default you can use folder input in file content  
2. **Content**: The content the user wants to include in the file.

### Context of Conversation:
{{recentMessages}}

Some file content found in the conversation:
{{contextDocument}}

### Instructions:
- If both the file path and content are provided by the user, output them in the specified JSON format.
- If no file path is provided, you can use source folder from the context document.
- If any required information is missing, ask a clarifying question to ensure both the path and content are captured accurately.
- The output must strictly follow this JSON format:
{
  "filePath": "example/path/to/file",
  "content": "Example content to write to the file."
}
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
