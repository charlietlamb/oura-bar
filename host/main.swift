import AppKit

let bundle = Bundle.main
let runtimeRoot = (bundle.resourceURL ?? bundle.bundleURL).appendingPathComponent("runtime")
let bunPath = bundle.object(forInfoDictionaryKey: "OuraBunPath") as? String ?? "/usr/local/bin/bun"
let interval = bundle.object(forInfoDictionaryKey: "OuraRefreshSeconds") as? Double ?? 120

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let controller = MenuController(projectRoot: runtimeRoot, bunPath: bunPath, interval: interval)
app.delegate = controller
app.run()
