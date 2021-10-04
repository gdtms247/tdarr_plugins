function details() {
  return {
    id: 'PERSONAL_4K_Movie_Step1',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_4K_Movie_Step1',
    Type: 'Audio',
    Operation: 'Audio Create',
    Description: `This plugin creates 6ch audio tracks if missing. \n\n`,
    Version: '1.00',
    Link: "",
    Tags: 'personal',
  };
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };


  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video. \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let streamIdx = 0;
  let has6Channel = false;
  let has8Channel = false;
  let convert = false;
  let removeattachments = ''

  // Go through each stream for attachment streams in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    var streamX = file.ffProbeData.streams[i]
    // Check if stream is a attachment.
    if (streamX.codec_type.toLowerCase() == 'attachment') {
      // Check if codec  of stream is ttf, if so then remove this stream.
      if (streamX.codec_name == 'ttf' || streamX.codec_name == 'otf') {
        removeattachments += `-map -0:t `;
        response.infoLog += `Attachments will be removed. \n`;
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


  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (file.ffProbeData.streams[i].channels === 6) {
          has6Channel = true;
        }
        if (file.ffProbeData.streams[i].channels === 8) {
          has8Channel = true;
        }
      }
    } catch (err) {
      // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is audio.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
      // Catch error here incase user left inputs.downmix empty.
      try {
          // Check if file has 8 channel audio but no 6 channel, if so then create extra downmix from the 8 channel.
          if (
            has8Channel === true
            && has6Channel === false
            && file.ffProbeData.streams[i].channels === 8
          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
            response.infoLog += '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel from 8 channel. \n';
            convert = true;
            break
          }
      } catch (err) {
        // Error
      }
      audioIdx += 1;
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.infoLog += `☑Required audio tracks will be added with existing tracks, processing file!\n`
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} ${removeattachments} `
    + '-sn -dn -max_muxing_queue_size 9999 -map_metadata:g -1 ';
  } else {
    response.infoLog += '☑File contains all required audio formats. \n';
    response.processFile = false;
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
