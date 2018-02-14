# gcf-ffmpeg-example
![gif](./example.gif)

## Summary
When a audio is uploaded to a Google Cloud Storage bucket, transcode the audio and place it in another Google Cloud Storage bucket.

## Usage
1. Open Google Cloud Console and create Google Cloud Storage bucket.
2. `gcloud beta functions deploy transcode --trigger-bucket [upload bucket name]`