// macOS-native exact variable-font path extraction, no font substitution.
import Foundation
import CoreText
import CoreGraphics

let args = CommandLine.arguments
let fontURL = URL(fileURLWithPath: args[1])
let descriptors = CTFontManagerCreateFontDescriptorsFromURL(fontURL as CFURL) as! [CTFontDescriptor]
let axes: [NSNumber: NSNumber] = [NSNumber(value: 0x77676874): 800, NSNumber(value: 0x77647468): 112]
let descriptor = CTFontDescriptorCreateCopyWithAttributes(descriptors[0], [kCTFontVariationAttribute: axes] as CFDictionary)
let font = CTFontCreateWithFontDescriptor(descriptor, 1000, nil)
let text = args.count > 3 ? args[3] : "PNW ADU"
let tracking = args.count > 4 ? Double(args[4])! : 0.04
let attr = NSAttributedString(string: text, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font, NSAttributedString.Key(kCTKernAttributeName as String): tracking * 1000])
let line = CTLineCreateWithAttributedString(attr)
let runs = CTLineGetGlyphRuns(line) as! [CTRun]
func n(_ v: CGFloat) -> String { return String(format: "%.4f", Double(v)) }
var parts: [String] = []
var bbox = CGRect.null
for run in runs {
 let count = CTRunGetGlyphCount(run)
 var glyphs = [CGGlyph](repeating: 0, count: count)
 var positions = [CGPoint](repeating: .zero, count: count)
 CTRunGetGlyphs(run, CFRange(location: 0, length: 0), &glyphs)
 CTRunGetPositions(run, CFRange(location: 0, length: 0), &positions)
 for i in 0..<count {
  var trans = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: positions[i].x, ty: -positions[i].y)
  guard let path = CTFontCreatePathForGlyph(font, glyphs[i], &trans) else { continue }
  bbox = bbox.union(path.boundingBoxOfPath)
  var p = ""
  path.applyWithBlock { ptr in
   let e = ptr.pointee
   let v = e.points
   switch e.type {
   case .moveToPoint: p += "M\(n(v[0].x)) \(n(v[0].y))"
   case .addLineToPoint: p += "L\(n(v[0].x)) \(n(v[0].y))"
   case .addQuadCurveToPoint: p += "Q\(n(v[0].x)) \(n(v[0].y)) \(n(v[1].x)) \(n(v[1].y))"
   case .addCurveToPoint: p += "C\(n(v[0].x)) \(n(v[0].y)) \(n(v[1].x)) \(n(v[1].y)) \(n(v[2].x)) \(n(v[2].y))"
   case .closeSubpath: p += "Z"
   @unknown default: break
   }
  }
  parts.append(p)
 }
}
let variation = CTFontCopyVariation(font) as? [NSNumber: NSNumber] ?? [:]
let result: [String: Any] = ["text":text, "family": CTFontCopyFamilyName(font), "weight": variation[NSNumber(value:0x77676874)] ?? 800, "width": variation[NSNumber(value:0x77647468)] ?? 112, "trackingEm":tracking, "fontSize":1000, "bbox":[bbox.minX,bbox.minY,bbox.width,bbox.height], "paths":parts]
let json = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
try json.write(to: URL(fileURLWithPath: args[2]))
print("Outlined \(parts.count) glyphs: Archivo wght 800 / wdth 112")
