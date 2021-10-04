function details () {
  return {
    id: 'PERSONAL_4K_Movie_Step2',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_4K_Movie_Step2',
    Type: 'Audio',
    Operation: 'Audio Transcode',
    Description: `This plugin transcodes any 6ch audio tracks if needed. \n\n`,
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
  let ch6good = false;
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 6 channel AC3 track exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' && file.ffProbeData.streams[i].channels === 6) {
        if (file.ffProbeData.streams[i].codec_name === 'ac3') {
          ch6good = true;
        }
        else {
          ch6good = false;
        }
      }
    } catch (err) {
      // Error
    }
  }



    //
    // AUDIO TRANSCODE
    //

    if (ch6good == false) {
        // Go through each stream in the file.
        for (let i = 0; i < file.ffProbeData.streams.length; i++) {
          // Check if stream is audio.
          if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' && file.ffProbeData.streams[i].channels === 6) {
              if (file.ffProbeData.streams[i].codec_name != 'ac3') {
                ffmpegCommandInsert += `-c:a:${audioIdx} ac3 `
                response.infoLog += `☒Audio track ${audioIdx} is 6 channel, but not AC3, converting to AC3. \n`
                audioIdx += 1
                convert = true
          } else {
              ffmpegCommandInsert += `-c:a:${audioIdx} copy `
              response.infoLog += `☒Audio track ${audioIdx} will be copied. \n`
              audioIdx += 1
              }
            }
          }
       }



    //
    //PROCESS FILE
    //
    if (convert === false) {
      response.infoLog += '☑File contains all required audio formats. \n';
      response.processFile = false;
    } else {
      response.processFile = true;
      response.infoLog += `☑Existing 6 ch audio tracks will be transcoded, processing file!\n`
      response.preset = `, -map 0 -c:v copy ${ffmpegCommandInsert} `
      + '-sn -dn -max_muxing_queue_size 9999 -map_metadata:g -1 ';
    }
    return response;
  }
  module.exports.details = details;
  module.exports.plugin = plugin;
