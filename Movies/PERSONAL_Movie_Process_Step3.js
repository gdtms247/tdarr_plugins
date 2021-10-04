function details () {
  return {
    id: 'PERSONAL_Movie_Process_Step3',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Process_Step3',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `This plugin uses GPU to transcode video stream if required. \n\n`,
    Version: '3.00',
    Link: "",
    Tags: 'personal',
  }
}

module.exports.plugin = function plugin (file, librarySettings, inputs) {
  var removeimages = ''
  var crf = '18'
  var ffmpeg_preset = 'slow'
  var processingcommandinsert = ' '
  var videocopy = false
  var videoIdx = 0
  var convert = false
  //default values that will be returned
  var response = {
    processFile: false,
    preset: '',
    container: 'mp4',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
    maxmux: false
  }

    //
    //CHECKS PART
    //

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== 'video') {
      response.processFile = false
      response.infoLog += `☒File is not a video. \n`
      return response
    }

    // Check if file is in mp4. If it isn't then exit plugin.
    if (file.container !== 'mp4') {
      response.processFile = false
      response.infoLog += `☒File is not in mp4 format. \n`
      return response
    }

    //
    //HWACCEL DECISION
    //

    // Check original video codec for GPU decoding
    if (file.video_codec_name === "hevc") {
      processingcommandinsert = `-hwaccel cuvid -c:v hevc_cuvid, -map 0 `
      response.infoLog += `☒Original codec is hevc. \n`
    } else if (file.video_codec_name === "h264") {
      processingcommandinsert = `-hwaccel cuvid -c:v h264_cuvid, -map 0 `
      response.infoLog += `☒Original codec is h264. \n`
    } else if (file.video_codec_name === "mjpeg") {
      processingcommandinsert = `-hwaccel cuvid -c:v mjpeg_cuvid, -map 0 `
      response.infoLog += `☒Original codec is mjpeg. \n`
    } else if (file.video_codec_name == "mpeg1") {
      processingcommandinsert = `-hwaccel cuvid -c:v mpeg1_cuvid, -map 0 `
      response.infoLog += `☒Original codec is mpeg1. \n`
    } else if (file.video_codec_name == "mpeg2") {
      processingcommandinsert = `-hwaccel cuvid -c:v mpeg2_cuvid, -map 0 `
      response.infoLog += `☒Original codec is mpeg2. \n`
    } else if (file.video_codec_name == "mpeg4") {
      processingcommandinsert = `-hwaccel cuvid -c:v mpeg4_cuvid, -map 0 `
      response.infoLog += `☒Original codec is mpeg4. \n`
    } else if (file.video_codec_name == "vc1") {
      processingcommandinsert = `-hwaccel cuvid -c:v vc1_cuvid, -map 0 `
      response.infoLog += `☒Original codec is vc1. \n`
    } else if (file.video_codec_name == "vp8") {
      processingcommandinsert = `-hwaccel cuvid -c:v vp8_cuvid, -map 0 `
      response.infoLog += `☒Original codec is vp8. \n`
    } else if (file.video_codec_name == "vp9") {
      processingcommandinsert = `-hwaccel cuvid -c:v vp9_cuvid, -map 0 `
      response.infoLog += `☒Original codec is vp9. \n`
    } else {
      processingcommandinsert = `, -map 0 `
      response.infoLog += `☒Original codec not known, using CPU decoding.\n`
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
        }
        // Copy stream if 1080p & bitrate is below 10M
        if (file.video_resolution == '1080p' && streamX.bit_rate < 20000000) {
          response.infoLog += `☒Video stream ${videoIdx} is 1080p & below 10M, will be copied.\n`
          processingcommandinsert += `-c:v:${videoIdx} copy `
          // Increment videoIdx.
          videoIdx++
          continue
        }
        // Copy stream if not 1080p & bitrate is below 5M
        if (file.video_resolution != '1080p' && streamX.bit_rate < 8000000) {
          response.infoLog += `☒Video stream ${videoIdx} is ${file.video_resolution} & below 5M, will be copied.\n`
          processingcommandinsert += `-c:v:${videoIdx} copy `
          // Increment videoIdx.
          videoIdx++
          continue
        }
        // Transcode video stream using CRF value!
        else {
          processingcommandinsert += `-c:v:${videoIdx} h264_nvenc -preset ${ffmpeg_preset} -crf ${crf} `
          response.infoLog += `☒Video stream ${videoIdx} is ${streamX.bit_rate} bit ${file.video_resolution} and will be transcoded. \n`
          convert = true
          // Increment videoIdx.
          videoIdx++
          continue
        }
      }
    }

    //
    //PROCESS FILE
    //

    // Convert file if convert variable is set to true.
    if (convert === true) {
    response.container = 'mp4'
    response.preset += ` ${processingcommandinsert} -c:a copy ${removeimages} `
    + `-max_muxing_queue_size 9999 -dn -sn -map_metadata:g -1`
    response.processFile = true
    response.infoLog += `File needs match standard video, processing!\n`
  } else {
    response.processFile = false
    response.infoLog += '☑File matches all standards. \n'
  }
    return response
}

  module.exports.details = details
