# Video from a Claude Design animation

`storyvid.m` loads an exported Claude Design animation page (the "Bundled
Page" HTML) in an offscreen WKWebView, steps its stage frame by frame
through the page's own `data-om-seek-to-time-frame` event, and writes an
H.264 MP4 with AVAssetWriter. The page's Export button only talks to the
Claude Design app, so this is how we get a file out of it on the Mac.
No ffmpeg, no Node; the Swift toolchain on this Mac is broken against its
SDK, so the tools are Objective-C built with clang.

Build once:

    cd marketing/stories/tools
    clang -fobjc-arc -Wno-deprecated-declarations -framework Cocoa -framework WebKit -framework AVFoundation -framework CoreVideo -framework CoreMedia -o storyvid storyvid.m
    clang -fobjc-arc -Wno-deprecated-declarations -framework Cocoa -framework AVFoundation -framework CoreMedia -framework ImageIO -o frames frames.m

Run (the page must be served over http, the bundle does not unpack from
file://; `.claude/launch.json` serves the scratchpad site folder on 8787):

    ./storyvid http://localhost:8787/destinations-story.html out.mp4 30 22 1080 1920
    ./frames out.mp4 . 1 11 21.5     # pulls frames to check them

First made 1 Nov 2026 for the Destinations story (148 places scrolling,
22 s), scheduled on Instagram through `marketing/postiz/post_once.py`.
The binaries and the MP4s are not committed.
