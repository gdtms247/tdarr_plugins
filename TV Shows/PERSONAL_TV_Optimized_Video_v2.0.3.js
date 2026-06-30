module.exports.details = function details() {
  return {
    id: 'PERSONAL_TV_Optimized_Video',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_TV_Optimized_Video',
    Type: 'Video',
    Operation: 'Transcode',
    Description:
      'v2.0.3 - Improved resolution detection using width + height to properly classify scope content (e.g., 1482x618 as 1080p). Bitrate logic unchanged.',
    Version: '2.0.3',
    Tags: 'personal,qsv,hevc,tv,optimized',
  };
};

function num(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function getVideoStream(file) {
  return (file.ffProbeData?.streams || []).find(
    (s) =>
      s.codec_type === 'video' &&
      s.codec_name !== 'mjpeg' &&
      s.codec_name !== 'png'
  );
}

function getResolutionTier(width, height) {
  if (width >= 1900 || height >= 1000) return '1080p';
  if (width >= 1200 || height >= 600) return '720p';
  return 'SD';
}

module.exports.plugin = function plugin(file) {
  const response = {
    processFile: false,
    preset: '',
    container: file.container || 'mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') return response;

  const videoStream = getVideoStream(file);
  if (!videoStream) return response;

  const width = num(videoStream.width);
  const height = num(videoStream.height);
  const codec = (videoStream.codec_name || '').toLowerCase();

  const tier = getResolutionTier(width, height);

  response.infoLog += `☑ Detected codec: ${codec}\n`;
  response.infoLog += `☑ Resolution: ${width}x${height} → ${tier}\n`;

  let threshold = 0;
  let targetBitrate = 0;
  let minBitrate = 0;

  if (tier === 'SD') {
    threshold = 1500;
    targetBitrate = 900;
    minBitrate = 800;
  } else if (tier === '720p') {
    threshold = 3500;
    targetBitrate = 1800;
    minBitrate = 1500;
  } else {
    threshold = 6000;
    targetBitrate = 3000;
    minBitrate = 2400;
  }

  const rawBytes =
    file.statSync?.size ||
    Math.round(num(file.file_size) * 1024 * 1024 * 1024);

  const durationSeconds =
    num(file.ffProbeData?.format?.duration) ||
    num(file.meta?.Duration);

  if (!rawBytes || !durationSeconds) return response;

  const overallBitrate = Math.round((rawBytes * 8) / durationSeconds / 1000);

  let audio = 0;
  let subs = 0;

  for (const s of file.ffProbeData?.streams || []) {
    const br = num(s.bit_rate);
    if (s.codec_type === 'audio' && br > 0) audio += br / 1000;
    if (s.codec_type === 'subtitle' && br > 0) subs += br / 1000;
  }

  audio = Math.round(audio);
  subs = Math.round(subs);

  const estimatedVideoBitrate = Math.max(
    0,
    Math.round(overallBitrate - audio - subs)
  );

  response.infoLog += `☑ TRUE overall bitrate: ${overallBitrate} kbps\n`;
  response.infoLog += `☑ Audio: ${audio} kbps\n`;
  response.infoLog += `☑ Subs: ${subs} kbps\n`;
  response.infoLog += `☑ Estimated video bitrate: ${estimatedVideoBitrate} kbps\n`;
  response.infoLog += `☑ Threshold: ${threshold} | Target: ${targetBitrate} | Floor: ${minBitrate}\n`;

  const allowedCodecs = ['h264', 'hevc'];

  if (!allowedCodecs.includes(codec)) {
    response.processFile = true;

    const finalBitrate = Math.max(
      minBitrate,
      Math.min(targetBitrate, estimatedVideoBitrate)
    );

    const bufsize = Math.round(estimatedVideoBitrate);

    response.infoLog += `☒ Forced transcode (${codec}) → HEVC ${finalBitrate} kbps\n`;

    response.preset =
      `<io>` +
      ` -map 0:v:0 -map 0:a? -map 0:s?` +
      ` -c:v hevc_qsv -b:v ${finalBitrate}k` +
      ` -maxrate ${Math.round(finalBitrate * 1.15)}k` +
      ` -bufsize ${bufsize}k` +
      ` -preset slow -c:a copy -c:s copy` +
      ` -map_metadata -1 -map_chapters -1`;

    return response;
  }

  if (estimatedVideoBitrate <= threshold) {
    response.infoLog += `☑ Below threshold → skipping\n`;
    return response;
  }

  response.processFile = true;

  const finalBitrate = Math.max(minBitrate, targetBitrate);
  const bufsize = Math.round(estimatedVideoBitrate);

  response.infoLog += `☒ Transcoding → ${finalBitrate} kbps\n`;

  response.preset =
    `<io>` +
    ` -map 0:v:0 -map 0:a? -map 0:s?` +
    ` -c:v hevc_qsv -b:v ${finalBitrate}k` +
    ` -maxrate ${Math.round(finalBitrate * 1.15)}k` +
    ` -bufsize ${bufsize}k` +
    ` -preset slow -c:a copy -c:s copy` +
    ` -map_metadata -1 -map_chapters -1`;

  return response;
};
