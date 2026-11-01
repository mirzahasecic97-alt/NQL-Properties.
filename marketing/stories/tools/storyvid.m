// storyvid: load a Claude Design animation page in an offscreen WKWebView,
// step its stage frame by frame through the data-om-seek-to-time-frame
// event, and write an H.264 MP4 with AVAssetWriter.
// usage: storyvid <url> <out.mp4> [fps=30] [duration=22] [w=1080] [h=1920] [visible=0]
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <AVFoundation/AVFoundation.h>

static void spin(double seconds) { [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:seconds]]; }
static BOOL waitUntil(BOOL (^pred)(void), double timeout) { NSDate *end = [NSDate dateWithTimeIntervalSinceNow:timeout]; while (!pred()) { if ([end timeIntervalSinceNow] < 0) return NO; spin(0.02); } return YES; }

static id evalJS(WKWebView *web, NSString *js) {
  __block BOOL done = NO; __block id out = nil; __block NSError *err = nil;
  [web evaluateJavaScript:js completionHandler:^(id r, NSError *e) { out = r; err = e; done = YES; }];
  waitUntil(^BOOL{ return done; }, 20);
  if (err) NSLog(@"js error: %@ for %@", err.localizedDescription, [js substringToIndex:MIN(80, js.length)]);
  return out;
}

static CVPixelBufferRef pixelBufferFromImage(CGImageRef img, CVPixelBufferPoolRef pool, int w, int h) {
  CVPixelBufferRef pb = NULL;
  CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &pb);
  if (!pb) return NULL;
  CVPixelBufferLockBaseAddress(pb, 0);
  CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();
  CGContextRef ctx = CGBitmapContextCreate(CVPixelBufferGetBaseAddress(pb), w, h, 8, CVPixelBufferGetBytesPerRow(pb), cs, kCGBitmapByteOrder32Little | kCGImageAlphaNoneSkipFirst);
  CGContextSetFillColorWithColor(ctx, CGColorGetConstantColor(kCGColorWhite));
  CGContextFillRect(ctx, CGRectMake(0, 0, w, h));
  CGContextSetInterpolationQuality(ctx, kCGInterpolationHigh);
  CGContextDrawImage(ctx, CGRectMake(0, 0, w, h), img);
  CGContextRelease(ctx); CGColorSpaceRelease(cs);
  CVPixelBufferUnlockBaseAddress(pb, 0);
  return pb;
}

int main(int argc, const char *argv[]) { @autoreleasepool {
  if (argc < 3) { fprintf(stderr, "usage: storyvid <url> <out.mp4> [fps] [duration] [w] [h] [visible]\n"); return 2; }
  NSString *url = @(argv[1]); NSString *outPath = @(argv[2]);
  int fps = argc > 3 ? atoi(argv[3]) : 30; double duration = argc > 4 ? atof(argv[4]) : 22;
  int W = argc > 5 ? atoi(argv[5]) : 1080, H = argc > 6 ? atoi(argv[6]) : 1920; BOOL visible = argc > 7 ? atoi(argv[7]) : 0;

  [NSApplication sharedApplication];
  [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
  NSRect frame = NSMakeRect(visible ? 100 : -20000, visible ? 100 : -20000, W, H + 80);
  NSWindow *win = [[NSWindow alloc] initWithContentRect:frame styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:NO];
  WKWebViewConfiguration *cfg = [WKWebViewConfiguration new];
  WKWebView *web = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, W, H + 80) configuration:cfg];
  [win setContentView:web];
  [win orderFront:nil];
  [web loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:url]]];

  NSString *readyJS = @"(function(){var s=document.querySelector('[data-om-exportable-video-with-duration-secs]');return !!(s&&s.getAttribute('data-om-fonts-inlined')==='true'&&document.fonts.status==='loaded');})()";
  if (!waitUntil(^BOOL{ return [evalJS(web, readyJS) boolValue]; }, 60)) { fprintf(stderr, "page never became ready\n"); return 1; }
  spin(1.0);
  // hide the transport bar, undo the fit-to-viewport scale, stop the engine's own clock
  evalJS(web, @"(function(){var st=document.createElement('style');st.textContent='[data-omelette-chrome]{display:none!important}';document.head.appendChild(st);var s=document.querySelector('[data-om-exportable-video-with-duration-secs]');s.style.transform='none';s.style.boxShadow='none';s.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame',{detail:{time:0,sync:true,playing:false}}));return true;})()");
  spin(0.5);
  NSDictionary *rectD = evalJS(web, @"(function(){var r=document.querySelector('[data-om-exportable-video-with-duration-secs]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()");
  CGRect rect = CGRectMake([rectD[@"x"] doubleValue], [rectD[@"y"] doubleValue], [rectD[@"w"] doubleValue], [rectD[@"h"] doubleValue]);
  NSLog(@"stage rect %@", NSStringFromRect(rect));
  if (rect.size.width < W - 2 || rect.size.height < H - 2) NSLog(@"warning: stage is smaller than %dx%d", W, H);

  [[NSFileManager defaultManager] removeItemAtPath:outPath error:nil];
  NSError *err = nil;
  AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:[NSURL fileURLWithPath:outPath] fileType:AVFileTypeMPEG4 error:&err];
  if (err) { NSLog(@"writer: %@", err); return 1; }
  NSDictionary *settings = @{ AVVideoCodecKey: AVVideoCodecTypeH264, AVVideoWidthKey: @(W), AVVideoHeightKey: @(H),
    AVVideoCompressionPropertiesKey: @{ AVVideoAverageBitRateKey: @(9000000), AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel, AVVideoMaxKeyFrameIntervalKey: @(fps), AVVideoExpectedSourceFrameRateKey: @(fps) } };
  AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:settings];
  input.expectsMediaDataInRealTime = NO;
  AVAssetWriterInputPixelBufferAdaptor *adaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:input sourcePixelBufferAttributes:@{ (id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA), (id)kCVPixelBufferWidthKey: @(W), (id)kCVPixelBufferHeightKey: @(H) }];
  [writer addInput:input];
  [writer startWriting];
  [writer startSessionAtSourceTime:kCMTimeZero];

  int total = (int)llround(duration * fps);
  WKSnapshotConfiguration *snap = [WKSnapshotConfiguration new];
  snap.rect = rect; snap.snapshotWidth = @(W); snap.afterScreenUpdates = YES;
  for (int i = 0; i < total; i++) { @autoreleasepool {
    double t = (double)i / fps;
    evalJS(web, [NSString stringWithFormat:@"(function(){document.querySelector('[data-om-exportable-video-with-duration-secs]').dispatchEvent(new CustomEvent('data-om-seek-to-time-frame',{detail:{time:%.6f,sync:true,playing:false}}));return true;})()", t]);
    __block NSImage *img = nil; __block BOOL done = NO;
    [web takeSnapshotWithConfiguration:snap completionHandler:^(NSImage *im, NSError *e) { img = im; if (e) NSLog(@"snapshot: %@", e); done = YES; }];
    waitUntil(^BOOL{ return done; }, 20);
    if (!img) { fprintf(stderr, "no snapshot at frame %d\n", i); return 1; }
    CGImageRef cg = [img CGImageForProposedRect:NULL context:nil hints:nil];
    CVPixelBufferRef pb = pixelBufferFromImage(cg, adaptor.pixelBufferPool, W, H);
    waitUntil(^BOOL{ return input.readyForMoreMediaData; }, 20);
    if (![adaptor appendPixelBuffer:pb withPresentationTime:CMTimeMake(i, fps)]) { NSLog(@"append failed at %d: %@", i, writer.error); return 1; }
    CVPixelBufferRelease(pb);
    if (i % fps == 0) { fprintf(stderr, "frame %d/%d (%.1fs)\n", i, total, t); }
  } }
  [input markAsFinished];
  __block BOOL finished = NO;
  [writer finishWritingWithCompletionHandler:^{ finished = YES; }];
  waitUntil(^BOOL{ return finished; }, 60);
  NSLog(@"done: %@ status=%ld %@", outPath, (long)writer.status, writer.error ?: @"");
  return writer.status == AVAssetWriterStatusCompleted ? 0 : 1;
} }
