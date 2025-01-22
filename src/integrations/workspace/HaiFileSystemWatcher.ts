import Watcher from "watcher"
import * as path from "path"
import * as fs from "fs/promises"
import ignore from "ignore"
import { HaiBuildDefaults } from "../../shared/haiDefaults"
import { ClineProvider } from "../../core/webview/ClineProvider"
import { FileOperations } from "../../utils/constants"

class HaiFileSystemWatcher {
	private sourceFolder: string
	private ig: ReturnType<typeof ignore>
	private providerRef: WeakRef<ClineProvider>
	private watcher: Watcher

	constructor(provider: ClineProvider, sourceFolder: string) {
		this.sourceFolder = sourceFolder
		this.providerRef = new WeakRef(provider)
		this.ig = ignore()
		this.watcher = new Watcher(this.sourceFolder, {
			recursive: true,
			debounce: 3000,
			ignoreInitial: true,
			ignore: (targetPath: string) => {
				if (!targetPath || targetPath.trim() === "") {
					console.warn("HaiFileSystemWatcher Ignoring empty or invalid path.")
					return true
				}

				const relativePath = path.relative(this.sourceFolder, targetPath)
				if (relativePath.startsWith("..")) {
					console.warn(`HaiFileSystemWatcher Path ${targetPath} is outside the workspace folder.`)
					return true
				}

				if (relativePath === "") {
					return false
				}

				const isIgnored = this.ig.ignores(relativePath)
				return isIgnored
			},
		})
		this.initializeWatcher().then()
	}

	private async loadGitIgnore() {
		try {
			const gitignorePath = path.join(this.sourceFolder, ".gitignore")
			const content = await fs.readFile(gitignorePath, "utf-8")

			this.ig.add(content.split("\n").filter((line) => line.trim() && !line.startsWith("#")))
		} catch (error) {
			console.log("HaiFileSystemWatcher No .gitignore found, using default exclusions.")
		}

		this.ig.add([...HaiBuildDefaults.defaultDirsToIgnore, HaiBuildDefaults.defaultContextDirectory])
	}

	private async initializeWatcher() {
		await this.loadGitIgnore()

		this.watcher.on("unlink", (filePath) => {
			console.log("HaiFileSystemWatcher File deleted", filePath)
            if (filePath.includes("hai-instructions")) {
				this.providerRef.deref()?.removeFromFileInstructions([filePath])
			} else {
				this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Create)
			}
			this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Delete)
		})

		this.watcher.on("add", (filePath) => {
			console.log("HaiFileSystemWatcher File added", filePath)
			if (filePath.includes("hai-instructions")) {
				this.providerRef.deref()?.addFileInstruction([filePath])
			} else {
				this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Create)
			}
		})

		this.watcher.on("change", (filePath) => {
			console.log("HaiFileSystemWatcher File changes", filePath)
			this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Change)
		})

		this.watcher.on("addDir", (filePath) => {
			let value = filePath.split("/").pop() === "hai-instructions"
			console.log("HaiFileSystemWatcher Folder added", value)
			if (value) {
				this.providerRef.deref()?.checkInstructionFilesFromFileSystem()
			}
		})

		this.watcher.on("unlinkDir", (filePath) => {
			let value = filePath.split("/").pop() === ".vscode" || filePath.split("/").pop() === "hai-instructions"
			console.log("HaiFileSystemWatcher Folder deleted", value)
			if (value) {
				this.providerRef.deref()?.updateFileInstructions([])
			}
		})
	}

	async dispose() {
		this.watcher.close()
	}
}

export default HaiFileSystemWatcher
