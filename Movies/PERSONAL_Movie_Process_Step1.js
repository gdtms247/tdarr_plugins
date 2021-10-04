function details() {
  return {
    id: 'PERSONAL_Movie_Process_Step1',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Process_Step1',
    Type: 'Audio',
    Operation: 'Create',
    Description: `This plugin creates any missing audio tracks. \n\n`,
    Version: '3.00',
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

  //
  //CHECKS PART
  //

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not video. \n';
    response.processFile = false;
    return response;
  }

  //
  //AUDIO CHECKS
  //

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let has2Channel = false;
  let has6Channel = false;
  let has7Channel = false;
  let has8Channel = false;
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (file.ffProbeData.streams[i].channels === 2) {
          has2Channel = true;
        }
        if (file.ffProbeData.streams[i].channels === 6) {
          has6Channel = true;
        }
        if (file.ffProbeData.streams[i].channels === 7) {
          has7Channel = true;
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
      try {
          // Check if file has 8 channel audio but no 2 channel, if so then create extra downmix from the 6 channel.
          if (
            has8Channel === true
            && has2Channel === false
            && file.ffProbeData.streams[i].channels === 8
          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `;
            response.infoLog += '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel from 6 channel. \n';
            convert = true;
            break
          }
          // Check if file has 7 channel audio but no 2 channel, if so then create extra downmix from the 6 channel.
          if (
            has7Channel === true
            && has2Channel === false
            && file.ffProbeData.streams[i].channels === 7
          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `;
            response.infoLog += '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel from 6 channel. \n';
            convert = true;
            break
          }
          // Check if file has 6 channel audio but no 2 channel, if so then create extra downmix from the 6 channel.
          if (
            has6Channel === true
            && has2Channel === false
            && file.ffProbeData.streams[i].channels === 6
          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `;
            response.infoLog += '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel from 6 channel. \n';
            convert = true;
            break
          }
      } catch (err) {
        // Error
      }
      audioIdx += 1;
    }
  }

  //
  //PROCESS FILE
  //

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.infoLog += `Required audio tracks will be added with existing tracks, processing file!\n`
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} `
    + '-max_muxing_queue_size 9999 -dn -sn -map_metadata:g -1';
  } else {
    response.processFile = false;
    response.infoLog += '☑File contains all required audio tracks. \n';
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
