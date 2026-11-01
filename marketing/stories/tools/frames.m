#import <Cocoa/Cocoa.h>
#import <AVFoundation/AVFoundation.h>
int main(int argc, const char *argv[]) { @autoreleasepool {
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:[NSURL fileURLWithPath:@(argv[1])] options:nil];
  AVAssetImageGenerator *gen = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
  gen.requestedTimeToleranceBefore = kCMTimeZero; gen.requestedTimeToleranceAfter = kCMTimeZero;
  for (int i = 3; i < argc; i++) {
    double sec = atof(argv[i]); NSError *e = nil;
    CGImageRef img = [gen copyCGImageAtTime:CMTimeMakeWithSeconds(sec, 600) actualTime:NULL error:&e];
    if (!img) { NSLog(@"frame %g: %@", sec, e); continue; }
    NSString *p = [NSString stringWithFormat:@"%s/frame-%gs.png", argv[2], sec];
    CGImageDestinationRef d = CGImageDestinationCreateWithURL((__bridge CFURLRef)[NSURL fileURLWithPath:p], (__bridge CFStringRef)@"public.png", 1, NULL);
    CGImageDestinationAddImage(d, img, NULL); CGImageDestinationFinalize(d);
    printf("%s %zux%zu\n", p.UTF8String, CGImageGetWidth(img), CGImageGetHeight(img));
  }
  printf("duration %.2fs\n", CMTimeGetSeconds(asset.duration));
} return 0; }
