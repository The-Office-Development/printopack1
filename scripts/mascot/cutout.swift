import Vision
import CoreImage
import AppKit
let a = CommandLine.arguments
let url = URL(fileURLWithPath: a[1])
let ci = CIImage(contentsOf: url)!
let h = VNImageRequestHandler(ciImage: ci)
let r = VNGenerateForegroundInstanceMaskRequest()
try h.perform([r])
guard let o = r.results?.first else { print("no subject"); exit(1) }
let buf = try o.generateMaskedImage(ofInstances: o.allInstances, from: h, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("ok", out.extent)
// preview on brand blue
let blue = CIImage(color: CIColor(red: 0, green: 0x46/255.0, blue: 0xa2/255.0)).cropped(to: out.extent)
try ctx.writePNGRepresentation(of: out.composited(over: blue), to: URL(fileURLWithPath: a[2] + ".blue.png"), format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
