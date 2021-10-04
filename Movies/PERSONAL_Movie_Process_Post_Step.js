/* eslint-disable */
function details() {
  return {
    id: "PERSONAL_Movie_Process_Post_Step",
    Stage: "Pre-processing",
    Name: "PERSONAL_Movie_Process_Post_Step",
    Type: "Video",
    Operation: 'Mux',
    Description: `This plugin will move the video stream to the front so if not already.\n\n`,
    Version: "1.00",
    Tags: "personal",
  };
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

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += " File is not video\n";
    response.processFile = false;

    return response;
  } else {
    response.FFmpegMode = true;
    response.container = "." + file.container;

    if (file.ffProbeData.streams[0].codec_type != "video") {
      response.infoLog += "Video is not in the first stream";
      response.preset =
        ",-map 0:v? -map 0:a? -map -0:s -map -0:d -sn -dn -c copy -max_muxing_queue_size 9999 -map_metadata:g -1";
      response.reQueueAfter = true;
      response.processFile = true;

      return response;
    } else {
      response.infoLog += "File has video in first stream\n";
    }

    response.infoLog += " File meets conditions!\n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
