import AppKit

enum StatusTitle {
    private static let symbolSize: CGFloat = 12
    private static let valueFont = NSFont.monospacedDigitSystemFont(ofSize: 13, weight: .medium)

    private struct Style {
        let filled: Bool
        let alpha: CGFloat
    }

    static func render(_ scores: Scores) -> NSAttributedString {
        let title = NSMutableAttributedString()
        let metrics: [(String, Int?)] = [
            ("moon.zzz", scores.sleep),
            ("bolt.heart", scores.readiness),
            ("flame", scores.activity),
        ]
        for (index, metric) in metrics.enumerated() {
            if index > 0 {
                title.append(NSAttributedString(string: "   ", attributes: [.font: valueFont]))
            }
            title.append(symbol(metric.0, style: style(for: metric.1)))
            title.append(NSAttributedString(string: " " + label(metric.1), attributes: [.font: valueFont]))
        }
        return title
    }

    private static func label(_ score: Int?) -> String {
        score.map(String.init) ?? "--"
    }

    private static func style(for score: Int?) -> Style {
        guard let score else { return Style(filled: false, alpha: 0.35) }
        if score >= 85 { return Style(filled: true, alpha: 1) }
        if score >= 70 { return Style(filled: false, alpha: 1) }
        return Style(filled: false, alpha: 0.5)
    }

    private static func symbol(_ name: String, style: Style) -> NSAttributedString {
        let symbolName = style.filled ? name + ".fill" : name
        let tint = NSColor.labelColor.withAlphaComponent(style.alpha)
        let configuration = NSImage.SymbolConfiguration(pointSize: symbolSize, weight: .medium)
            .applying(NSImage.SymbolConfiguration(paletteColors: [tint]))
        guard let image = NSImage(systemSymbolName: symbolName, accessibilityDescription: nil)?
            .withSymbolConfiguration(configuration) else {
            return NSAttributedString(string: "")
        }
        let attachment = NSTextAttachment()
        attachment.image = image
        attachment.bounds = NSRect(x: 0, y: valueFont.descender + 1, width: image.size.width, height: image.size.height)
        return NSAttributedString(attachment: attachment)
    }
}
