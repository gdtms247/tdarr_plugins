function details () {
  return {
    id: 'PERSONAL_Movie_Process_Pre_Step',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Process_Pre_Step',
    Type: 'Audio',
    Operation: 'Cleanup',
    Description: `This plugin will remove any foreign audio tracks if needed. \n\n`,
    Version: '2.0',
    Link: "",
    Tags: 'personal',
  }
}


function plugin(file) {
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  response.FFmpegMode = true;

  //check if files is video

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  }

  var ffmpegCommandInsert = "";
  var audioIdx = -1;
  var hasNonEngTrack = false;
  var audioStreamsRemoved = 0;
  var processfile = true;

  //count number of audio streams
  var audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() == "audio"
  ).length;

  console.log("audioStreamCount:" + audioStreamCount);

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    //check if current stream is audio, update audioIdx if so
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++;
      }
    } catch (err) {}

    try {
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        !(
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes("eng") ||
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes("und")
        )
      ) {
        audioStreamsRemoved++;

        if (audioStreamsRemoved == audioStreamCount) {
          processfile = false;
          break;
        }

        ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
        hasNonEngTrack = true;
      }
    } catch (err) {}
  }
if (processfile == true) {
  if (hasNonEngTrack === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.container = "." + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog +=
      "☒File contains tracks which are not english or undefined. Removing! \n";
    return response;
  } else {
    response.infoLog +=
      "☑File doesn't contain tracks which are not english or undefined! \n";
  }
} else {
  response.infoLog +=
    "☑Removing any non English tracks results in loss of audio, no processing! \n";
}
  response.processFile = false;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
