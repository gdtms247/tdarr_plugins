# Movie Library Plugin Stack

Plugin stack used to transcode HD movie files.

PERSONAL_Movie_Process_Pre_Step: Plugin will remove any foreign audio tracks if needed
PERSONAL_Movie_Process_Step1: Plugin creates any missing audio tracks
PERSONAL_Movie_Process_Step2: Plugin transcodes audio if needed and mux file to mp4 if not already
PERSONAL_Movie_Process_Step3: Plugin uses GPU to transcode video stream if required
PERSONAL_Movie_Process_Post_Step: Plugin will move the video stream to the front so if not already


https://github.com/gdtms247/tdarr_plugins/blob/bd1f7b39271ab205a737fba250f3c8d15bae319a/Movies/Movies.png
