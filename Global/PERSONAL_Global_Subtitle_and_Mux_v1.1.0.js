// tdarrSkipTest
/**
 * PERSONAL_Global_Subtitle_and_Mux
 *
 * v1.1.0
 *
 * Fixes:
 * - Restores original library path detection for subtitle sidecars
 * - Prevents subtitles from being written to Tdarr workDir/cache
 * - Uses final renamed filename while writing sidecars beside library media
 *
 * Improvements retained from v1.0.1:
 * - Proper hvc1 detection
 * - Improved skip logic
 * - Safe/idempotent processing
 */

const details = () => ({
  id: 'PERSONAL_Global_Subtitle_and_Mux',
  Stage: 'Post-processing',
  Name: 'PERSONAL_Global_Subtitle_and_Mux',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
    'Extract English TEXT subtitles to SRT sidecars, strip all subtitle streams, remove data/attachments, and remux to MP4 with faststart and hvc1 tagging in a single pass.',
  Version: '1.1.0',
  Tags: 'subtitle,mp4,remux,faststart,hvc1,optimization',
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const path = require('path');

  const response = {
    processFile: true,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  const streams = file.ffProbeData?.streams || [];

  const subs = streams.filter((s) => s.codec_type === 'subtitle');

  const allowed = new Set([
    'subrip',
    'mov_text',
    'ass',
    'ssa',
    'webvtt',
  ]);

  const englishSubs = subs.filter((s) => {
    const lang = (s.tags?.language || '').toLowerCase();

    return [
      'eng',
      'en',
      'en-us',
      'en-gb',
    ].includes(lang);
  });

  // ------------------------------------------------------------
  // ORIGINAL LIBRARY PATH DISCOVERY
  // (borrowed from proven Subtitle_Extraction plugin)
  // ------------------------------------------------------------

  const toPathString = (v) => {
    if (!v) return '';

    if (typeof v === 'string') return v;

    if (typeof v === 'object') {
      if (typeof v.file === 'string') return v.file;
      if (typeof v._id === 'string') return v._id;

      if (
        v.sourceFile &&
        typeof v.sourceFile.file === 'string'
      ) {
        return v.sourceFile.file;
      }

      if (
        v.sourceFile &&
        typeof v.sourceFile._id === 'string'
      ) {
        return v.sourceFile._id;
      }
    }

    return '';
  };

  const candidates = [
    toPathString(otherArguments?.originalLibraryFile),
    toPathString(otherArguments?.originalFile),
    toPathString(otherArguments?.libraryFile),
    toPathString(otherArguments?.sourceFile),
    toPathString(otherArguments?.file),
    toPathString(file?._id),
  ].filter(Boolean);

  let libraryPath = '';

  if (
    librarySettings &&
    typeof librarySettings.folder === 'string'
  ) {
    libraryPath =
      candidates.find((p) =>
        p.startsWith(librarySettings.folder)
      ) || '';
  }

  if (!libraryPath) {
    libraryPath =
      candidates.find((p) => p.startsWith('/')) || '';
  }

  if (!libraryPath) {
    libraryPath =
      typeof file.file === 'string'
        ? file.file
        : '';
  }

  if (!libraryPath) {
    response.processFile = false;
    response.infoLog +=
      'Could not determine library path. Skipping to avoid writing subtitle to cache.\n';

    return response;
  }

  // Use ORIGINAL LIBRARY DIRECTORY
  const libraryDir = path.dirname(libraryPath);

  // Use CURRENT WORKING FILENAME
  // so subtitles match final renamed media file
  const workingPath =
    typeof file.file === 'string'
      ? file.file
      : libraryPath;

  const base = path.basename(
    workingPath,
    path.extname(workingPath)
  );

  const srtPath = path.join(
    libraryDir,
    `${base}.en.srt`
  );

  response.infoLog += `Library path: ${libraryPath}\n`;
  response.infoLog += `Subtitle output: ${srtPath}\n`;

  // ------------------------------------------------------------
  // VIDEO ANALYSIS
  // ------------------------------------------------------------

  const video = streams.find(
    (s) => s.codec_type === 'video'
  );

  const isHevc =
    video &&
    (video.codec_name || '').toLowerCase() === 'hevc';

  const currentTag =
    (video?.codec_tag_string || '').toLowerCase();

  const needsHevcTag =
    isHevc &&
    currentTag !== 'hvc1';

  const hasSubs = subs.length > 0;

  const hasAttachments = streams.some(
    (s) => s.codec_type === 'attachment'
  );

  const hasData = streams.some(
    (s) => s.codec_type === 'data'
  );

  const alreadyMp4 =
    (file.container || '').toLowerCase() === 'mp4';

  // ------------------------------------------------------------
  // SKIP LOGIC
  // ------------------------------------------------------------

  if (
    alreadyMp4 &&
    !hasSubs &&
    !hasAttachments &&
    !hasData &&
    !needsHevcTag
  ) {
    response.processFile = false;

    response.infoLog +=
      '☑ Already compliant MP4 (no subs/data/attachments + hvc1 correct). Skipping.\n';

    return response;
  }

  // ------------------------------------------------------------
  // SUBTITLE SELECTION
  // ------------------------------------------------------------

  const candidatesSubs = englishSubs.filter((s) =>
    allowed.has(
      (s.codec_name || '').toLowerCase()
    )
  );

  let selectedSub = null;

  if (candidatesSubs.length) {
    selectedSub = candidatesSubs.sort(
      (a, b) =>
        (a.index || 0) -
        (b.index || 0)
    )[0];
  }

  // ------------------------------------------------------------
  // BUILD FFMPEG COMMAND
  // ------------------------------------------------------------

  let cmd = '-y <io> ';

  if (selectedSub) {
    cmd +=
      `-map 0:${selectedSub.index} ` +
      `-c:s srt "${srtPath}" `;

    response.infoLog +=
      `Extracting subtitle ${selectedSub.index} → ${path.basename(
        srtPath
      )}\n`;
  } else {
    response.infoLog +=
      'No eligible English text subtitles found.\n';
  }

  cmd += `
-map 0
-map -0:s?
-map -0:d?
-map -0:t?
-dn
-c copy
`;

  if (needsHevcTag) {
    cmd += '-tag:v:0 hvc1 ';

    response.infoLog +=
      'Applying hvc1 tag fix for HEVC.\n';
  }

  cmd += `
-map_metadata 0
-map_metadata:s:a 0:s:a
-map_chapters -1
-movflags +faststart
`;

  response.preset = cmd;

  response.infoLog +=
    '✅ Combined subtitle extraction + MP4 mux complete.\n';

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;