import { ApiConfiguration, ApiProvider } from "./api"
import { HaiBuildContextOptions, HaiInstructionFile } from "./customApi"
import { EmbeddingConfiguration } from "./embeddings"
import { AutoApprovalSettings } from "./AutoApprovalSettings"

export interface WebviewMessage {
	type:
		| "apiConfiguration"
		| "customInstructions"
		| "alwaysAllowReadOnly"
		| "webviewDidLaunch"
		| "newTask"
		| "askResponse"
		| "clearTask"
		| "didShowAnnouncement"
		| "selectImages"
		| "exportCurrentTask"
		| "showTaskWithId"
		| "deleteTaskWithId"
		| "exportTaskWithId"
		| "resetState"
		| "requestOllamaModels"
		| "requestLmStudioModels"
		| "openImage"
		| "openFile"
		| "openMention"
		| "cancelTask"
		| "refreshOpenRouterModels"
		| "onHaiConfigure"
		| "buildContextOptions"
		| "embeddingConfiguration"
		| "validateLLMConfig"
		| "validateEmbeddingConfig"
		| "openMcpSettings"
		| "restartMcpServer"
		| "autoApprovalSettings"
		| "openHistory"
		| "openHaiTasks"
		| "showToast"
		| "uploadInstruction"
		| "deleteInstruction"
		| "fileInstructions"
	text?: string
	askResponse?: ClineAskResponse
	apiConfiguration?: ApiConfiguration
	images?: string[]
	bool?: boolean
	buildContextOptions?: HaiBuildContextOptions
	embeddingConfiguration?: EmbeddingConfiguration
	autoApprovalSettings?: AutoApprovalSettings
	fileInstructions? : HaiInstructionFile[]
	toast?: { message: string; toastType: "error" | "warning" | "info" } 
}

export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse"
