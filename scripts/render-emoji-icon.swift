import AppKit
import CoreText

let args = Array(CommandLine.arguments.dropFirst())
guard let outputPath = args.first(where: { !$0.hasPrefix("--") }) else {
  fputs("Usage: render-emoji-icon.swift <output.png> [--transparent]\n", stderr)
  exit(1)
}
let transparent = args.contains("--transparent")
let size = 1024
let cornerRadius: CGFloat = 315
let accent = NSColor(red: 1.0, green: 0.42, blue: 0.24, alpha: 1.0)

guard let bitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: size,
  pixelsHigh: size,
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
) else {
  fputs("Failed to create bitmap\n", stderr)
  exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

if transparent {
  NSColor.clear.setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: size, height: size)).fill()
} else {
  accent.setFill()
  NSBezierPath(
    roundedRect: NSRect(x: 0, y: 0, width: size, height: size),
    xRadius: cornerRadius,
    yRadius: cornerRadius
  ).fill()
}

let emoji = "🛒"
let font = NSFont(name: "Apple Color Emoji", size: 500) ?? NSFont.systemFont(ofSize: 500)
let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center
let attrs: [NSAttributedString.Key: Any] = [
  .font: font,
  .paragraphStyle: paragraph,
]
let str = NSAttributedString(string: emoji, attributes: attrs)
let line = CTLineCreateWithAttributedString(str)
var ascent: CGFloat = 0
var descent: CGFloat = 0
var leading: CGFloat = 0
let lineWidth = CTLineGetTypographicBounds(line, &ascent, &descent, &leading)

// 正の値 = 下へ移動（typographic center から引く）
let downNudge: CGFloat = 12
let x = (CGFloat(size) - lineWidth) / 2
let y = (CGFloat(size) - ascent - descent) / 2 + descent - downNudge

if let context = NSGraphicsContext.current?.cgContext {
  context.textMatrix = .identity
  context.textPosition = CGPoint(x: x, y: y)
  CTLineDraw(line, context)
}

NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Failed to encode PNG\n", stderr)
  exit(1)
}

do {
  try png.write(to: URL(fileURLWithPath: outputPath))
  print("Wrote \(outputPath) (\(size)x\(size))")
} catch {
  fputs("Write failed: \(error)\n", stderr)
  exit(1)
}
