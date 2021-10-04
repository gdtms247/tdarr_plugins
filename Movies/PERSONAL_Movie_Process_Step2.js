function details () {
  return {
    id: 'PERSONAL_Movie_Process_Step2',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Process_Step2',
    Type: 'Audio',
    Operation: 'Audio Transcode & Mux',
    Description: `This plugin transcodes audio if needed and mux file to mp4 if not already. \n\n`,
    Version: '3.00',
    Link: "",
    Tags: 'personal',
  }
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    container: 'mp4',
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


  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let convert = false;


  //
  //CONTAINER CHECKS
  //

  // Set convert to true if container isn't mp4.
  if (file.container !== 'mp4') {
    response.infoLog += `☒File is not in mp4. \n`;
    convert = true;
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
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 7 channel audio that isn't AC3, convert to AC3 if not
          if (file.ffProbeData.streams[i].channels === 7 && file.ffProbeData.streams[i].codec_name != 'ac3') {
            ffmpegCommandInsert += `-c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
            response.infoLog += `☒Audio track ${audioIdx} is 7 channel, but not AC3, converting to AC3. \n`;
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
          if (file.ffProbeData.streams[i].channels === 6 && file.ffProbeData.streams[i].codec_name != 'ac3') {
            ffmpegCommandInsert += `-c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
            response.infoLog += `☒Audio track ${audioIdx} is 6 channel, but not AC3, converting to AC3. \n`;
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
          if (file.ffProbeData.streams[i].channels === 5 && file.ffProbeData.streams[i].codec_name != 'ac3') {
            ffmpegCommandInsert += `-c:a:${audioIdx} ac3 `;
            response.infoLog += `☒Audio track ${audioIdx} is 5 channel, but not AC3, converting to AC3. \n`;
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 6 channel audio that isn't AC3, convert to AC3 if not
          if (file.ffProbeData.streams[i].channels === 4 && file.ffProbeData.streams[i].codec_name != 'ac3') {
            ffmpegCommandInsert += `-c:a:${audioIdx} ac3 `;
            response.infoLog += `☒Audio track ${audioIdx} is 4 channel, but not AC3, converting to AC3. \n`;
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 2 channel audio that isn't AAC, MP3, or Opus, convert to AAC if not
          if (file.ffProbeData.streams[i].channels === 2 && !['aac', 'mp3', 'opus'].includes(file.ffProbeData.streams[i].codec_name)) {
            ffmpegCommandInsert += `-c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `;
            response.infoLog += `☒Audio track ${audioIdx} is 2 channel, but not AAC, MP3, or Opus, converting to AAC.. \n`;
            convert = true;
            audioIdx++
            continue
          }
          // Check if stream is 1 channel audio that isn't AAC, MP3, or Opus, convert to AAC if not
          if (file.ffProbeData.streams[i].channels === 1 && !['aac', 'mp3', 'opus'].includes(file.ffProbeData.streams[i].codec_name)) {
            ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
            response.infoLog += `☒Audio track ${audioIdx} is 2 channel, but not AAC, MP3, or Opus, converting to AAC. \n`;
            convert = true;
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
  //PROCESS FILE
  //

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.infoLog += `☒File needs match standards, processing!\n`
    response.preset = `, -map 0 -c:v copy ${ffmpegCommandInsert} -map -0:s -map -0:d -dn -sn -max_muxing_queue_size 9999 -map_metadata:g -1`;
  } else {
    response.processFile = false;
    response.infoLog += '☑File is in correct format and audio is in correct codec. \n';
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
