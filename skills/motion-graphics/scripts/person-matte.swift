// Writes a person matte for every frame in a folder, using Apple Vision's on-device person segmentation.
// Usage: person-matte <framesDir> <outDir>   (compiled by `mg mattes` with swiftc, macOS 12+)
// Output PNGs are greyscale: white where the person is, black elsewhere, at the input frame size.
import AppKit
import CoreImage
import Foundation
import Vision

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  print("usage: person-matte <framesDir> <outDir>")
  exit(1)
}

let inputDir = URL(fileURLWithPath: arguments[1])
let outputDir = URL(fileURLWithPath: arguments[2])
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

let context = CIContext()
let files = try FileManager.default.contentsOfDirectory(atPath: inputDir.path)
  .filter { $0.hasSuffix(".jpg") || $0.hasSuffix(".png") }
  .sorted()

for name in files {
  let url = inputDir.appendingPathComponent(name)
  guard let source = CIImage(contentsOf: url) else { continue }

  let request = VNGeneratePersonSegmentationRequest()
  request.qualityLevel = .accurate
  request.outputPixelFormat = kCVPixelFormatType_OneComponent8
  let handler = VNImageRequestHandler(ciImage: source)
  try handler.perform([request])
  guard let buffer = request.results?.first?.pixelBuffer else { continue }

  let mask = CIImage(cvPixelBuffer: buffer)
  let scaleX = source.extent.width / mask.extent.width
  let scaleY = source.extent.height / mask.extent.height
  let scaled = mask.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: scaleY, kCIInputAspectRatioKey: scaleX / scaleY])
    .cropped(to: source.extent)
  let outName = (name as NSString).deletingPathExtension + ".png"
  let colorSpace = CGColorSpaceCreateDeviceGray()
  try context.writePNGRepresentation(of: scaled, to: outputDir.appendingPathComponent(outName), format: .L8, colorSpace: colorSpace)
}

print("mattes: \(files.count)")
