// Hand and arm joints for every frame in a folder, from Apple Vision, as JSON lines on stdout.
// Usage: pose <framesDir>   (swiftc -O pose.swift -o pose)
// Each line: {"frame": "f_00012.jpg", "hands": [[[x, y, confidence], …21 joints], …], "arms": [[x, y, confidence], …]}
// Coordinates are normalised with the origin at the top left. Arms are left/right shoulder, elbow, wrist.
import AppKit
import Foundation
import Vision

let arguments = CommandLine.arguments
guard arguments.count == 2 else {
  print("usage: pose <framesDir>")
  exit(1)
}

let inputDir = URL(fileURLWithPath: arguments[1])
let files = try FileManager.default.contentsOfDirectory(atPath: inputDir.path)
  .filter { $0.hasSuffix(".jpg") || $0.hasSuffix(".png") }
  .sorted()
let handJoints: [VNHumanHandPoseObservation.JointName] = [
  .wrist, .thumbCMC, .thumbMP, .thumbIP, .thumbTip, .indexMCP, .indexPIP, .indexDIP, .indexTip,
  .middleMCP, .middlePIP, .middleDIP, .middleTip, .ringMCP, .ringPIP, .ringDIP, .ringTip,
  .littleMCP, .littlePIP, .littleDIP, .littleTip,
]
let armJoints: [VNHumanBodyPoseObservation.JointName] = [
  .leftShoulder, .leftElbow, .leftWrist, .rightShoulder, .rightElbow, .rightWrist,
]

func encode(_ point: VNRecognizedPoint?) -> [Double] {
  guard let point = point else { return [0, 0, 0] }

  return [Double(point.location.x), 1 - Double(point.location.y), Double(point.confidence)]
}

for name in files {
  let url = inputDir.appendingPathComponent(name)
  let handRequest = VNDetectHumanHandPoseRequest()
  handRequest.maximumHandCount = 2
  let bodyRequest = VNDetectHumanBodyPoseRequest()
  let handler = VNImageRequestHandler(url: url)
  try handler.perform([handRequest, bodyRequest])

  let hands = (handRequest.results ?? []).map { observation -> [[Double]] in
    let points = try? observation.recognizedPoints(.all)
    return handJoints.map { encode(points?[$0]) }
  }
  var arms: [[Double]] = armJoints.map { _ in [0, 0, 0] }
  if let body = bodyRequest.results?.first, let points = try? body.recognizedPoints(.all) {
    arms = armJoints.map { encode(points[$0]) }
  }
  let line: [String: Any] = ["frame": name, "hands": hands, "arms": arms]
  let data = try JSONSerialization.data(withJSONObject: line)
  print(String(data: data, encoding: .utf8)!)
}
