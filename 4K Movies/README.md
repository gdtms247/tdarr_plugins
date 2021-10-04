# 4K Movie Library Plugin Stack

Plugin stack used to transcode 4K movie files. Part of the stack reuses plugins from Movies stack.

- PERSONAL_Movie_Process_Pre_Step: This plugin will remove any foreign audio tracks if needed
- PERSONAL_4K_Movie_Step1: This plugin creates 6ch audio tracks if missing
- PERSONAL_4K_Movie_Step2: This plugin transcodes any 6ch audio tracks if needed
- PERSONAL_4K_Movie_Step3: This plugin transcodes audio if needed and mux file to mp4 if not already
- PERSONAL_Movie_Process_Post_Step: This plugin will move the video stream to the front so if not already


<p align="center">
  <img src="https://github.com/gdtms247/tdarr_plugins/blob/159cac4029cc16c4cab102ee981afc8fb44d3a18/4K%20Movies/4K%20Movies.png"/>
</p>
