// transcode: re-encode a video to H.264 at a chosen size and bitrate, no audio.
//   clang -framework Foundation -framework AVFoundation -framework CoreMedia -framework CoreVideo -o transcode transcode.m
//   ./transcode in.mp4 out.mp4 1920 1080 5000000
// Written 2 Nov 2026 because this Mac has no ffmpeg and avconvert's presets
// pick their own bitrate (20 MB for a 10 s hero).
#import <AVFoundation/AVFoundation.h>
int main(int argc, char **argv) {
  @autoreleasepool {
    if (argc < 6) { fprintf(stderr, "usage: transcode in out width height bitrate\n"); return 2; }
    NSURL *in = [NSURL fileURLWithPath:@(argv[1])], *out = [NSURL fileURLWithPath:@(argv[2])];
    int W = atoi(argv[3]), H = atoi(argv[4]), BR = atoi(argv[5]);
    [[NSFileManager defaultManager] removeItemAtURL:out error:nil];
    AVAsset *asset = [AVAsset assetWithURL:in];
    AVAssetTrack *vt = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    if (!vt) { fprintf(stderr, "no video track\n"); return 1; }
    NSError *err = nil;
    AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:asset error:&err];
    NSDictionary *rs = @{(id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
                         (id)kCVPixelBufferWidthKey: @(W), (id)kCVPixelBufferHeightKey: @(H)};
    AVAssetReaderTrackOutput *ro = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:vt outputSettings:rs];
    [reader addOutput:ro];
    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:out fileType:AVFileTypeMPEG4 error:&err];
    NSDictionary *ws = @{AVVideoCodecKey: AVVideoCodecTypeH264, AVVideoWidthKey: @(W), AVVideoHeightKey: @(H),
                         AVVideoCompressionPropertiesKey: @{AVVideoAverageBitRateKey: @(BR),
                                                            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                                                            AVVideoMaxKeyFrameIntervalKey: @60,
                                                            AVVideoExpectedSourceFrameRateKey: @30}};
    AVAssetWriterInput *wi = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:ws];
    wi.transform = vt.preferredTransform;
    [writer addInput:wi];
    [reader startReading]; [writer startWriting]; [writer startSessionAtSourceTime:kCMTimeZero];
    long n = 0;
    while (reader.status == AVAssetReaderStatusReading) {
      CMSampleBufferRef sb = [ro copyNextSampleBuffer];
      if (!sb) break;
      while (!wi.readyForMoreMediaData) usleep(2000);
      [wi appendSampleBuffer:sb]; CFRelease(sb); n++;
    }
    [wi markAsFinished];
    dispatch_semaphore_t done = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(done); }];
    dispatch_semaphore_wait(done, DISPATCH_TIME_FOREVER);
    if (writer.status != AVAssetWriterStatusCompleted) { fprintf(stderr, "write failed: %s\n", writer.error.localizedDescription.UTF8String); return 1; }
    printf("%ld frames -> %s (%dx%d @ %d bps)\n", n, argv[2], W, H, BR);
    return 0;
  }
}
