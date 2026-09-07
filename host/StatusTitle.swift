import AppKit

enum StatusTitle {
    private static let symbolSize: CGFloat = 12
    private static let valueFont = NSFont.monospacedDigitSystemFont(ofSize: 13, weight: .medium)

    static func render(_ scores: Scores) -> NSAttributedString {
        let title = NSMutableAttributedString()
        let metrics: [(String, Int?)] = [
            ("moon.zzz.fill", scores.sleep),
            ("bolt.heart.fill", scores.readiness),
            ("flame.fill", scores.activity),
        ]
        for (index, metric) in metrics.enumerated() {
            if index > 0 {
                title.append(NSAttributedString(string: "   ", attributes: [.font: valueFont]))
            }
            title.append(symbol(metric.0, tone: tone(for: metric.1)))
            title.append(NSAttributedString(string: " " + label(metric.1), attributes: [.font: valueFont]))
        }
        return title
    }

    private static func label(_ score: Int?) -> String {
        score.map(String.init) ?? "--"
    }

    private static func tone(for score: Int?) -> NSColor {
        guard let score else { return .tertiaryLabelColor }
        if score >= 85 { return NSColor(srgbRed: 0.19, green: 0.82, blue: 0.35, alpha: 1) }
        if score >= 70 { return NSColor(srgbRed: 1.0, green: 0.62, blue: 0.04, alpha: 1) }
        return NSColor(srgbRed: 1.0, green: 0.27, blue: 0.23, alpha: 1)
    }

    private static func symbol(_ name: String, tone: NSColor) -> NSAttributedString {
        let configuration = NSImage.SymbolConfiguration(pointSize: symbolSize, weight: .semibold)
            .applying(NSImage.SymbolConfiguration(paletteColors: [tone]))
        guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil)?
            .withSymbolConfiguration(configuration) else {
            return NSAttributedString(string: "")
        }
        let attachment = NSTextAttachment()
        attachment.image = image
        let descent = valueFont.descender
        attachment.bounds = NSRect(x: 0, y: descent + 1, width: image.size.width, height: image.size.height)
        return NSAttributedString(attachment: attachment)
    }
}
