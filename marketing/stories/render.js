// osascript -l JavaScript render.js in.html out.png width height
ObjC.import('Cocoa'); ObjC.import('WebKit');
const args = $.NSProcessInfo.processInfo.arguments;
const inPath = ObjC.unwrap(args.objectAtIndex(4)), outPath = ObjC.unwrap(args.objectAtIndex(5));
const w = parseFloat(ObjC.unwrap(args.objectAtIndex(6))), h = parseFloat(ObjC.unwrap(args.objectAtIndex(7)));
const app = $.NSApplication.sharedApplication;
const frame = $.NSMakeRect(0, 0, w, h);
const web = $.WebView.alloc.initWithFrameFrameNameGroupName(frame, $(), $());
const win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(frame, 0, 2, false);
win.contentView = web;
web.mainFrame.loadRequest($.NSURLRequest.requestWithURL($.NSURL.fileURLWithPath(inPath)));
const until = $.NSDate.dateWithTimeIntervalSinceNow(0.2);
let t = 0;
while ((web.isLoading || t < 2.5) && t < 15) { $.NSRunLoop.currentRunLoop.runUntilDate($.NSDate.dateWithTimeIntervalSinceNow(0.25)); t += 0.25; }
const view = web.mainFrame.frameView.documentView;
const rect = view.bounds;
const rep = view.bitmapImageRepForCachingDisplayInRect(rect);
view.cacheDisplayInRectToBitmapImageRep(rect, rep);
const png = rep.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $());
png.writeToFileAtomically(outPath, true);
"wrote " + outPath + " " + rep.pixelsWide + "x" + rep.pixelsHigh;
