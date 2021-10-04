function details () {
  return {
    id: 'PERSONAL_TV_Process_Step0',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_TV_Process_Step0',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `This plugin uses GPU to transcode video stream if required. \n\n`,
    Version: '1.00',
    Link: "",
    Tags: 'personal',
  };
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    preset: '',
    container: 'mp4',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
    maxmux: false
  };

    //
    //CHECKS PART
    //

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== 'video') {
      response.processFile = false
      response.infoLog += `☒File is not a video. \n`
      return response
    }

    // Set up required variables.
    let gpuprocessingcommandinsert = ' '
    let processingcommandinsert = ' '
    let videoIdx = 0
    let streamIdx = 0
    let convert = false
    let removeimages = ''
    let removeattachments = ''



    //
    // Attachments PART
    //


    // Go through each stream for attachment streams in the file.
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      var streamX = file.ffProbeData.streams[i]
      // Check if stream is a attachment.
      if (streamX.codec_type.toLowerCase() == 'attachment') {
        // Check if codec  of stream is ttf, if so then remove this stream.
        if (streamX.codec_name == 'ttf' || streamX.codec_name == 'otf') {
          removeattachments += `-map -0:t `
          response.infoLog += `Attachments will be removed. \n`
          convert = true
          break
        }
       // Video stream will be copied.
        else {
            streamIdx++
            continue
        }
      }
    }


    //
    // VIDEO PART
    //

    // Go through each stream for video streams in the file.
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      var streamX = file.ffProbeData.streams[i]
      // Check if stream is a video.
      if (streamX.codec_type.toLowerCase() == 'video') {
        // Check if codec  of stream is mjpeg/png, if so then remove this "video" stream. mjpeg/png are usually embedded pictures that can cause havoc with plugins.
        if (streamX.codec_name == 'mjpeg' || streamX.codec_name == 'png') {
          removeimages += `-map -v:${videoIdx} `
          response.infoLog += `☒Video stream ${videoIdx} will be removed. \n`
          convert = true
          videoIdx++
          continue
        // Check if codec of stream is msmpeg4v3, if so then transcode this stream.
        }
        if (streamX.codec_name == 'msmpeg4v3') {
            processingcommandinsert += `-c:v:${videoIdx} h264_nvenc -preset slow -crf 18 `
            response.infoLog += `☒Video stream ${videoIdx} is msmpeg4v3 and will be transcoded. \n`
            convert = true
            // Increment videoIdx.
            videoIdx++
            continue
        }
        // Check if codec of stream is msmpeg4v3, if so then transcode this stream.
        if (streamX.codec_name == 'mpeg4') {
            processingcommandinsert += `-c:v:${videoIdx} h264_nvenc -preset slow -crf 18 `
            response.infoLog += `☒Video stream ${videoIdx} is mpeg4 and will be transcoded. \n`
            convert = true
            // Increment videoIdx.
            videoIdx++
            continue
        }
        // Video stream will be copied.
        else {
            processingcommandinsert += `-c:v:${videoIdx} copy `
            response.infoLog += `☒Video stream ${videoIdx} will be copied.\n`
            // Increment videoIdx.
            videoIdx++
            continue
        }
      }
    }

    //
    //AUDIO CHECKS
    //

    // Go through each stream in the file.
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      // Check if stream is audio.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        try {
            // Check if stream is 8 channel audio that isn't AC3, convert to AC3 if not
            if (file.ffProbeData.streams[i].channels === 8 && file.ffProbeData.streams[i].codec_name != 'ac3') {
              ffmpegCommandInsert += `-c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
              response.infoLog += `☒Audio track ${audioIdx} is 8 channel, but not AC3, converting to AC3. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 7 channel audio that isn't AC3, convert to AC3 if not
            if (file.ffProbeData.streams[i].channels === 7 && file.ffProbeData.streams[i].codec_name != 'ac3') {
              ffmpegCommandInsert += `-c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
              response.infoLog += `☒Audio track ${audioIdx} is 7 channel, but not AC3, converting to AC3. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
            if (file.ffProbeData.streams[i].channels === 6 && file.ffProbeData.streams[i].codec_name != 'ac3') {
              ffmpegCommandInsert += `-c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
              response.infoLog += `☒Audio track ${audioIdx} is 6 channel, but not AC3, converting to AC3. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
            if (file.ffProbeData.streams[i].channels === 5 && file.ffProbeData.streams[i].codec_name != 'ac3') {
              ffmpegCommandInsert += `-c:a:${audioIdx} ac3 `;
              response.infoLog += `☒Audio track ${audioIdx} is 5 channel, but not AC3, converting to AC3. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
            if (file.ffProbeData.streams[i].channels === 4 && file.ffProbeData.streams[i].codec_name != 'ac3') {
              ffmpegCommandInsert += `-c:a:${audioIdx} ac3 `;
              response.infoLog += `☒Audio track ${audioIdx} is 4 channel, but not AC3, converting to AC3. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 2 channel audio that isn't AAC, MP3, or Opus, convert to AAC if not
            if (file.ffProbeData.streams[i].channels === 2 && file.ffProbeData.streams[i].codec_name != 'aac') {
              ffmpegCommandInsert += `-c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `;
              response.infoLog += `☒Audio track ${audioIdx} is 2 channel, but not AAC, converting to AAC. \n`;
              audioIdx++
              continue
            }
            // Check if stream is 1 channel audio that isn't AAC, MP3, or Opus, convert to AAC if not
            if (file.ffProbeData.streams[i].channels === 1 && file.ffProbeData.streams[i].codec_name != 'aac') {
              ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
              response.infoLog += `☒Audio track ${audioIdx} is 2 channel, but not AAC, converting to AAC. \n`;
              audioIdx++
              continue
            }
            // Stream is in correct codec type
            else {
              ffmpegCommandInsert += `-c:a:${audioIdx} copy `;
              response.infoLog += `☒Audio track ${audioIdx} is compatible. Will not be transcoded. \n`;
              audioIdx++
              continue
            }
        } catch (err) {
          // Error
        }
      }
    }


    //
    //HWACCEL DECISION
    //

    if (convert === true) {
      // Check original video codec for GPU decoding
      if (file.video_codec_name === "hevc") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v hevc_cuvid, -map 0 `
        response.infoLog += `☒Original codec is hevc. \n`
      } else if (file.video_codec_name === "h264") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v h264_cuvid, -map 0 `
        response.infoLog += `☒Original codec is h264. \n`
      } else if (file.video_codec_name === "mjpeg") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v mjpeg_cuvid, -map 0 `
        response.infoLog += `☒Original codec is mjpeg. \n`
      } else if (file.video_codec_name == "mpeg1") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v mpeg1_cuvid, -map 0 `
        response.infoLog += `☒Original codec is mpeg1. \n`
      } else if (file.video_codec_name == "mpeg2") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v mpeg2_cuvid, -map 0 `
        response.infoLog += `☒Original codec is mpeg2. \n`
      } else if (file.video_codec_name == "mpeg4") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v mpeg4_cuvid, -map 0 `
        response.infoLog += `☒Original codec is mpeg4. \n`
      } else if (file.video_codec_name == "vc1") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v vc1_cuvid, -map 0 `
        response.infoLog += `☒Original codec is vc1. \n`
      } else if (file.video_codec_name == "vp8") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v vp8_cuvid, -map 0 `
        response.infoLog += `☒Original codec is vp8. \n`
      } else if (file.video_codec_name == "vp9") {
        gpuprocessingcommandinsert = `-hwaccel cuvid -c:v vp9_cuvid, -map 0 `
        response.infoLog += `☒Original codec is vp9. \n`
      } else {
        gpuprocessingcommandinsert = `, -map 0 `
        response.infoLog += `☒Original codec not known, using CPU decoding.\n`
      }
    }



    //
    //PROCESS FILE
    //

    // Convert file if convert variable is set to true.
    if (convert === true) {
    response.container = 'mp4'
    response.preset += ` ${gpuprocessingcommandinsert} ${processingcommandinsert} -c:a copy ${removeattachments} ${removeimages} `
    + `-max_muxing_queue_size 9999 -dn -sn -map_metadata:g -1`
    response.processFile = true
    response.infoLog += `File needs match standard video, processing!\n`
  } else {
    response.processFile = false
    response.infoLog += '☑File video stream does not need transcoded. \n'
  }
    return response
}

  module.exports.details = details;
  module.exports.plugin = plugin;
