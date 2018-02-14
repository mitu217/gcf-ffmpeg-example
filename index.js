'use strict';

const storage = require('@google-cloud/storage')();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

const transcodedBucket = storage.bucket('transcode');
const uploadBucket = storage.bucket('upload');
ffmpeg.setFfmpegPath(ffmpegPath);

exports.transcode = function transcode(event, callback) {
    const file = event.data;

    // Ensure that you only proceed if the file is newly created, and exists.
    if (file.metageneration !== '1' || file.resourceState !== 'exists') {
        callback();
        return;
    }

    // Open write stream to new bucket, modify the filename as needed.
    const remoteWriteStream = transcodedBucket.file(file.name)
    .createWriteStream({
        metadata: {
            metadata: file.metadata, // You may not need this, my uploads have associated metadata
        },
    });

    // Open read stream to our uploaded file
    const remoteReadStream = uploadBucket.file(file.name).createReadStream();

    // Transcode
    ffmpeg()
    .input(remoteReadStream)
    .outputOptions('-vn')
    .outputOptions('-ac 2')
    .outputOptions('-ar 44100')
    .outputOptions('-ab 128k')
    .outputOptions('-acodec libmp3lame')
    .outputOptions('-f mp3')
    // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/346#issuecomment-67299526 
    .on('start', (cmdLine) => {
        console.log('Started ffmpeg with command:', cmdLine);
    })
    .on('end', () => {
        console.log('Successfully re-encoded video.');
        callback();
    })
    .on('error', (err, stdout, stderr) => {
        console.error('An error occured during encoding', err.message);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        callback(err);
    })
    .pipe(remoteWriteStream, { end: true }); // end: true, emit end event when readable stream ends
};
