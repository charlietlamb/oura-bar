import AppKit
import Foundation

struct Scores: Decodable {
    let readiness: Int?
    let sleep: Int?
    let activity: Int?
}

struct Payload: Decodable {
    let title: String
    let scores: Scores?
    let card: String?
    let updated: String
    let day: String?
    let error: String?

    static func failure(_ message: String) -> Payload {
        Payload(title: "Oura", scores: nil, card: nil, updated: "", day: nil, error: message)
    }
}

final class MenuController: NSObject, NSApplicationDelegate, NSMenuDelegate {
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private let menu = NSMenu()
    private let projectRoot: URL
    private let bunPath: String
    private let interval: TimeInterval
    private let logURL: URL
    private var timer: Timer?
    private var signalSource: DispatchSourceSignal?
    private var isRefreshing = false
    private var isMenuOpen = false

    init(projectRoot: URL, bunPath: String, interval: TimeInterval) {
        self.projectRoot = projectRoot
        self.bunPath = bunPath
        self.interval = interval
        let logs = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs")
        self.logURL = logs.appendingPathComponent("OuraBar.log")
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let button = statusItem.button else { return }
        button.image = NSImage(systemSymbolName: "circle.circle.fill", accessibilityDescription: "Oura")
        button.imagePosition = .imageLeading
        button.font = NSFont.monospacedDigitSystemFont(ofSize: NSFont.systemFontSize, weight: .medium)
        button.title = " –"
        menu.delegate = self
        statusItem.menu = menu
        rebuildMenu(with: nil)
        refresh()
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.refresh()
        }
        installSignalHandler()
    }

    func menuWillOpen(_ menu: NSMenu) { isMenuOpen = true }
    func menuDidClose(_ menu: NSMenu) { isMenuOpen = false }

    private func installSignalHandler() {
        signal(SIGUSR1, SIG_IGN)
        let source = DispatchSource.makeSignalSource(signal: SIGUSR1, queue: .main)
        source.setEventHandler { [weak self] in
            guard let self else { return }
            if self.isMenuOpen {
                self.menu.cancelTracking()
            } else {
                self.statusItem.button?.performClick(nil)
            }
        }
        source.resume()
        signalSource = source
    }

    @objc private func refresh() {
        guard !isRefreshing else { return }
        isRefreshing = true
        let appearance = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? "Dark" : "Light"
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }
            let payload = self.runFetch(appearance: appearance)
            DispatchQueue.main.async {
                self.isRefreshing = false
                self.apply(payload)
            }
        }
    }

    private func runFetch(appearance: String) -> Payload {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: bunPath)
        process.arguments = ["run", "src/cli/fetch.ts"]
        process.currentDirectoryURL = projectRoot
        let outputURL = FileManager.default.temporaryDirectory.appendingPathComponent("oura-payload-\(getpid()).json")
        var environment = ProcessInfo.processInfo.environment
        environment["OS_APPEARANCE"] = appearance
        environment["OURA_OUTPUT_PATH"] = outputURL.path
        process.environment = environment
        process.standardInput = FileHandle.nullDevice
        process.standardOutput = FileHandle.nullDevice
        process.standardError = openLog()

        do {
            try process.run()
        } catch {
            return .failure(error.localizedDescription)
        }
        process.waitUntilExit()

        if let data = try? Data(contentsOf: outputURL),
           let payload = try? JSONDecoder().decode(Payload.self, from: data) {
            try? FileManager.default.removeItem(at: outputURL)
            return payload
        }
        return .failure("fetch exited \(process.terminationStatus); see ~/Library/Logs/OuraBar.log")
    }

    private func openLog() -> FileHandle? {
        let manager = FileManager.default
        if !manager.fileExists(atPath: logURL.path) {
            manager.createFile(atPath: logURL.path, contents: nil)
        }
        guard let handle = try? FileHandle(forWritingTo: logURL) else { return nil }
        handle.seekToEndOfFile()
        return handle
    }

    private func apply(_ payload: Payload) {
        if let scores = payload.scores {
            statusItem.button?.image = nil
            statusItem.button?.attributedTitle = StatusTitle.render(scores)
        } else {
            statusItem.button?.title = " " + payload.title
        }
        rebuildMenu(with: payload)
    }

    private func rebuildMenu(with payload: Payload?) {
        menu.removeAllItems()
        if let card = payload?.card, let data = Data(base64Encoded: card), let image = NSImage(data: data) {
            let item = NSMenuItem()
            let inset: CGFloat = 8
            let container = NSView(frame: NSRect(x: 0, y: 0, width: image.size.width + inset * 2, height: image.size.height))
            let view = NSImageView(image: image)
            view.frame = NSRect(x: inset, y: 0, width: image.size.width, height: image.size.height)
            container.addSubview(view)
            item.view = container
            menu.addItem(item)
            menu.addItem(.separator())
        }
        if let error = payload?.error {
            menu.addItem(infoItem(error, symbol: "exclamationmark.triangle.fill"))
        }
        if let payload, !payload.updated.isEmpty {
            let day = payload.day.map { "  ·  \($0)" } ?? ""
            menu.addItem(infoItem("Updated \(payload.updated)\(day)", symbol: "clock"))
        } else if payload == nil {
            menu.addItem(infoItem("Loading…", symbol: "clock"))
        }
        menu.addItem(actionItem("Refresh", symbol: "arrow.clockwise", action: #selector(refresh), key: "r"))
        menu.addItem(actionItem("Open Oura", symbol: "safari", action: #selector(openOura), key: "o"))
        menu.addItem(.separator())
        menu.addItem(actionItem("Quit", symbol: "power", action: #selector(quit), key: "q"))
    }

    private func infoItem(_ title: String, symbol: String) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        item.image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)
        item.isEnabled = false
        return item
    }

    private func actionItem(_ title: String, symbol: String, action: Selector, key: String) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
        item.image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)
        item.target = self
        return item
    }

    @objc private func openOura() {
        NSWorkspace.shared.open(URL(string: "https://cloud.ouraring.com/")!)
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }
}
