module.exports.details = function details() {
  return {
    id: "PERSONAL_TV_Downgrade",
    Stage: "Pre-processing",
    Name: "PERSONAL_TV_Downgrade",
    Type: "",
    Operation: "Transcode",
    Description: `Downgrade TV shows based on size standards  \n\n`,
    Version: "2.00",
    Link: "",
    Tags: "personal,handbrake",
 };
};

module.exports.plugin = function plugin(file) {
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    reQueueAfter: false,
    infoLog: "",
   };

   if (file.fileMedium !== "video") {
     response.infoLog += "☒File is not video \n";
     response.processFile = false;
     return response;
   }

  // Check if file is over standard size
  if (file.file_size < 950) {
    response.processFile = false
    response.reQueueAfter = false
    response.infoLog += `☑File is under standard size, plugin will not do anything.\n`
    return response
  } else {
    response.infoLog += `☒File over standard size, will process!\n`
  }

  response.processFile = true;
  response.preset = '--preset-import-file "/mnt/preset/TV_Downgrade.json" -Z "TV Downgrade"';
  response.handBrakeMode = true;
  response.reQueueAfter = true;
  return response;
};
