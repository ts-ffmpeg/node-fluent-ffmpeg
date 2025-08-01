// @ts-ffmpeg/fluent-ffmpeg
import ffmpeg from '.'
import { createWriteStream } from "fs";

const stream = createWriteStream("outputfile.divx");

// Set the CWD
ffmpeg("file.avi", { cwd: "/path/to" }).output("ouptutfile.mp4");

ffmpeg("/path/to/file.avi").output("outputfile.mp4").output(stream);

ffmpeg("/path/to/file.avi")
    // You may pass a pipe() options object when using a stream
    .output(stream, { end: true });

// Output-related methods apply to the last output added
ffmpeg("/path/to/file.avi")
    .output("outputfile.mp4")
    .audioCodec("libfaac")
    .videoCodec("libx264")
    .size("320x200")
    .output(stream)
    .preset("divx")
    .size("640x480");

// get arguments
ffmpeg("/path/to/file.avi")._getArguments();

// ComplexFilter
ffmpeg("/path/to/file.avi")
    .output("outputfile.mp4")
    .complexFilter(
        [
            { inputs: "0:v", filter: "scale", options: { w: 1920, h: 1080, interl: 1 }, outputs: [] },
            { inputs: "0:a", filter: "amerge", options: { inputs: 2 }, outputs: "am" },
            "[am]aresample=48000:async=1[are]",
            { inputs: "are", filter: "channelsplit", options: { channel_layout: "stereo" }, outputs: [] },
        ],
        [],
    )
    .audioCodec("libfaac")
    .videoCodec("libx264")
    .size("320x200");

// Use the run() method to run commands with multiple outputs
ffmpeg("/path/to/file.avi")
    .output("outputfile.mp4")
    .output(stream)
    .on("end", () => {
        console.log("Finished processing");
    })
    .run();

// Create a command to convert source.avi to MP4
const command = ffmpeg("/path/to/source.avi").audioCodec("libfaac").videoCodec("libx264").format("mp4");

// Create a clone to save a small resized version
command.clone().size("320x200").save("/path/to/output-small.mp4");

// Create a clone to save a medium resized version
command.clone().size("640x400").save("/path/to/output-medium.mp4");

// Save a converted version with the original size
command.save("/path/to/output-original-size.mp4");

ffmpeg.ffprobe("/path/to/file.avi", (err, metadata) => {
    console.dir(metadata);
});

ffmpeg.setFfmpegPath("path/to/ffmpeg");
ffmpeg.setFfprobePath("path/to/ffprobe");
ffmpeg.setFfmpegPath("path/to/ffmpeg");

ffmpeg.getAvailableFormats((err, formats) => {
    console.log("Available formats:");
    console.dir(formats);
});

ffmpeg.getAvailableCodecs((err, codecs) => {
    console.log("Available codecs:");
    console.dir(codecs);
});

ffmpeg.getAvailableEncoders((err, encoders) => {
    console.log("Available encoders:");
    console.dir(encoders);
});

ffmpeg.getAvailableFilters((err, filters) => {
    console.log("Available filters:");
    console.dir(filters);
});

ffmpeg.ffprobe("/path/to/file.mp4", (err, data) => {
    console.log(data.format.filename);
    console.log(data.streams[0].bit_rate);
});

ffmpeg("/path/to.mp4").loop().videoBitrate(300, true);

ffmpeg("/path/to/file.avi").preset(command => {
    command.format("avi").size("720x?");
});

ffmpeg("/path/to/part1.avi")
    .input("/path/to/part2.avi")
    .input("/path/to/part2.avi")
    .mergeToFile("/path/to/merged.avi", "/path/to/tempDir");

ffmpeg("/path/to/file.avi")
    .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
    })
    .on("codecData", (data) => {
        console.log(
            "Input is " + data.audio + " audio "
                + "with " + data.video + " video",
        );
    })
    .on("progress", (progress) => {
        console.log("Processing: " + progress.percent + "% done");
    })
    .on("stderr", (stderrLine) => {
        console.log("Stderr output: " + stderrLine);
    })
    .on("error", (err, stdout, stderr) => {
        console.log("Cannot process video: " + err.message);
    })
    .on("end", () => {
        console.log("Transcoding succeeded !");
    });

ffmpeg("/path/to/file.avi")
    .on("filenames", (filenames) => {
        console.log("Created screenshots " + filenames.join(", "));
    })
    .on("end", () => {
        console.log("Transcoding succeeded !");
    })
    .screenshots({
        timestamps: [0, 1, 2],
        folder: "/path/to/output",
    });