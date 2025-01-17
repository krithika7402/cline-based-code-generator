import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useEvent } from "react-use"
import { DEFAULT_AUTO_APPROVAL_SETTINGS } from "../../../src/shared/AutoApprovalSettings"
import { ExtensionMessage, ExtensionState } from "../../../src/shared/ExtensionMessage"
import {
	ApiConfiguration,
	ModelInfo,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo
} from "../../../src/shared/api"
import { EmbeddingConfiguration } from "../../../src/shared/embeddings"
import { vscode } from "../utils/vscode"
import { convertTextMateToHljs } from "../utils/textMateToHljs"
import { findLastIndex } from "../../../src/shared/array"
import { HaiBuildContextOptions, HaiInstructionFile } from "../../../src/shared/customApi"
import { McpServer } from "../../../src/shared/mcp"

interface ExtensionStateContextType extends ExtensionState {
	didHydrateState: boolean
	showWelcome: boolean
	theme: any
	openRouterModels: Record<string, ModelInfo>
	mcpServers: McpServer[]
	filePaths: string[]
	setApiConfiguration: (config: ApiConfiguration) => void
	setCustomInstructions: (value?: string) => void
	setFileInstructions: (value: HaiInstructionFile[]) => void
	setIsCustomInstructionsEnabled: (value: boolean) => void
	setAlwaysAllowReadOnly: (value: boolean) => void
	setShowAnnouncement: (value: boolean) => void
	setBuildContextOptions: (value: HaiBuildContextOptions) => void
	haiConfig: { [key in string]: any }
	setHaiConfig: (value: { [key in string]: any }) => void
	setEmbeddingConfiguration: (config: EmbeddingConfiguration) => void
}

const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, setState] = useState<ExtensionState>({
		version: "",
		clineMessages: [],
		taskHistory: [],
		shouldShowAnnouncement: false,
		isCustomInstructionsEnabled: true,
		autoApprovalSettings: DEFAULT_AUTO_APPROVAL_SETTINGS,
	})
	const [didHydrateState, setDidHydrateState] = useState(false)
	const [showWelcome, setShowWelcome] = useState(false)
	const [theme, setTheme] = useState<any>(undefined)
	const [filePaths, setFilePaths] = useState<string[]>([])
	const [openRouterModels, setOpenRouterModels] = useState<Record<string, ModelInfo>>({
		[openRouterDefaultModelId]: openRouterDefaultModelInfo
	})
	const [haiConfig, setHaiConfig] = useState({})
	const [mcpServers, setMcpServers] = useState<McpServer[]>([])

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		switch (message.type) {
			case "state": {
				setState(message.state!)
				const config = message.state?.apiConfiguration
				const hasKey = config
					? [
						config.apiKey,
						config.openRouterApiKey,
						config.awsRegion,
						config.vertexProjectId,
						config.openAiApiKey,
						config.ollamaModelId,
						config.lmStudioModelId,
						config.geminiApiKey,
						config.openAiNativeApiKey,
					].some((key) => key !== undefined)
					: false
					const embedding = message.state?.embeddingConfiguration;
					const hasEmbeddingKey = embedding
					? [
						embedding.awsRegion,
						embedding.openAiNativeApiKey,
						embedding.azureOpenAIApiKey,
						embedding.openAiApiKey
					].some((key) => key !== undefined)
					: false
				setShowWelcome(!(hasKey || hasEmbeddingKey))
				setDidHydrateState(true)
				break
			}
			case "theme": {
				if (message.text) {
					setTheme(convertTextMateToHljs(JSON.parse(message.text)))
				}
				break
			}
			case "workspaceUpdated": {
				setFilePaths(message.filePaths ?? [])
				break
			}
			case "partialMessage": {
				const partialMessage = message.partialMessage!
				setState((prevState) => {
					// worth noting it will never be possible for a more up-to-date message to be sent here or in normal messages post since the presentAssistantContent function uses lock
					const lastIndex = findLastIndex(prevState.clineMessages, (msg) => msg.ts === partialMessage.ts)
					if (lastIndex !== -1) {
						const newClineMessages = [...prevState.clineMessages]
						newClineMessages[lastIndex] = partialMessage
						return { ...prevState, clineMessages: newClineMessages }
					}
					return prevState
				})
				break
			}
			case "openRouterModels": {
				const updatedModels = message.openRouterModels ?? {}
				setOpenRouterModels({
					[openRouterDefaultModelId]: openRouterDefaultModelInfo, // in case the extension sent a model list without the default model
					...updatedModels,
				})
				break
			}
			case "haiConfig": {
				setHaiConfig(message.haiConfig || {});
				break
			}
			case "mcpServers": {
				setMcpServers(message.mcpServers ?? [])
				break
			}
		}
	}, [])

	useEvent("message", handleMessage)

	useEffect(() => {
		vscode.postMessage({ type: "webviewDidLaunch" })
	}, [])

	const contextValue: ExtensionStateContextType = {
		...state,
		didHydrateState,
		showWelcome,
		theme,
		openRouterModels,
		mcpServers,
		filePaths,
		haiConfig,
		setHaiConfig: (value) => setHaiConfig((prevState) => ({ ...prevState, ...value })),
		setApiConfiguration: (value) => setState((prevState) => ({ ...prevState, apiConfiguration: value })),
		setCustomInstructions: (value) => setState((prevState) => ({ ...prevState, customInstructions: value })),
		setIsCustomInstructionsEnabled: (value) => setState((prevState) => ({ ...prevState, isCustomInstructionsEnabled: value })),
		setFileInstructions: (value) => setState((prevState) => ({ ...prevState, fileInstructions: value })),
		setAlwaysAllowReadOnly: (value) => setState((prevState) => ({ ...prevState, alwaysAllowReadOnly: value })),
		setShowAnnouncement: (value) => setState((prevState) => ({ ...prevState, shouldShowAnnouncement: value })),
		setBuildContextOptions: (value) => setState((prevState) => ({...prevState, buildContextOptions: value })),
		setEmbeddingConfiguration: (value) => setState((prevState) => ({ ...prevState, embeddingConfiguration: value })),
	}

	return <ExtensionStateContext.Provider value={contextValue}>{children}</ExtensionStateContext.Provider>
}

export const useExtensionState = () => {
	const context = useContext(ExtensionStateContext)
	if (context === undefined) {
		throw new Error("useExtensionState must be used within an ExtensionStateContextProvider")
	}
	return context
}