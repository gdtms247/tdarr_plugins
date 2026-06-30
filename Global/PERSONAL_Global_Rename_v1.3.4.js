/*
PERSONAL_Global_Rename (v1.3.4)

==================================================
FINAL PRODUCTION VERSION
==================================================

TV:
- Full rebuild (source-resolution + media tags)

MOVIES:
- Preserve existing structure
- Preserve source + HDR tags
- Remove ONLY audio + codec tags
- Rebuild clean audio/video tags

Fixes:
- Movie tag destruction (v1.3.3 bug)
- TV structure regression (v1.3.x bug)
- Duplicate codec tags
- x264/x265 normalization
==================================================
*/

function details() {
  return {
    id: "PERSONAL_Global_Rename",
    Stage: "Post-processing",
    Name: "PERSONAL_Global_Rename",
    Type: "Video",
    Operation: "Rename",
    Version: "1.3.4",
    Tags: "post-processing"
  };
}

// ---------- Helpers ----------

function safeStr(v) {
  return (v === undefined || v === null) ? "" : String(v);
}

function getStreams(file) {
  return file?.ffProbeData?.streams || [];
}

function normalizeCodecName(name) {
  return safeStr(name).toLowerCase();
}

function isTV(name) {
  return /S\d{2}E\d{2}/i.test(name);
}

// ---------- Codec ----------

function videoCodecTag(vs) {
  const c = normalizeCodecName(vs?.codec_name);
  if (["hevc","h265","x265"].includes(c)) return "h265";
  if (["h264","avc","x264"].includes(c)) return "h264";
  return c.toUpperCase();
}

function audioCodecTag(as) {
  const c = normalizeCodecName(as?.codec_name);
  const map = {
    aac:"AAC",
    ac3:"AC3",
    eac3:"EAC3",
    flac:"FLAC",
    opus:"OPUS",
    mp3:"MP3",
    truehd:"TRUEHD",
    dts:"DTS"
  };
  return map[c] || c.toUpperCase();
}

function channelsTag(ch) {
  const map = {1:"1.0",2:"2.0",6:"5.1",8:"7.1"};
  return map[ch] || `${ch}ch`;
}

function pickAudio(streams) {
  return streams
    .filter(s => s.codec_type === "audio")
    .sort((a,b)=> (b.channels||0)-(a.channels||0))[0] || null;
}

function pickVideo(streams) {
  return streams.find(s => s.codec_type === "video");
}

// ---------- TV BUILD ----------

function buildTV(name, streams) {

  // strip everything
  let clean = name.replace(/\[[^\]]+\]/g,"");

  // remove resolution from wrong position
  clean = clean.replace(/-(480p|576p|720p|1080p|2160p)/i,"");

  const res = name.match(/(480p|576p|720p|1080p|2160p)/i)?.[1] || "";
  const src = clean.match(/(HDTV|WEBDL|WEBRip|BluRay)/i)?.[1] || "";

  if (src && res) {
    clean = clean.replace(src, `${src}-${res}`);
  }

  const v = pickVideo(streams);
  const a = pickAudio(streams);

  return `${clean}[${audioCodecTag(a)}][${channelsTag(a.channels)}][${videoCodecTag(v)}]`;
}

// ---------- MOVIE BUILD ----------

function cleanMovieTags(name) {

  return name
    // remove audio tags
    .replace(/\[(?:[^\]]*(DTS|TRUEHD|EAC3|DDP|AC3|AAC|FLAC|OPUS|MP3)[^\]]*)\]/gi,"")

    // remove codec tags
    .replace(/\[(x264|x265|h264|h265|avc|hevc)\]/gi,"")

    // remove channel tags
    .replace(/\[(\d\.\d|[1-9]ch)\]/gi,"")

    .replace(/\[\s*\]/g,"")
    .trim();
}

function extractGroup(name) {
  const m = name.match(/-([A-Za-z0-9]+)$/);
  if (!m) return { base: name, group: "" };

  return {
    base: name.slice(0, m.index),
    group: m[0]
  };
}

function buildMovie(name, streams) {

  const { base, group } = extractGroup(name);

  const cleaned = cleanMovieTags(base);

  const v = pickVideo(streams);
  const a = pickAudio(streams);

  return `${cleaned}[${audioCodecTag(a)}][${channelsTag(a.channels)}][${videoCodecTag(v)}]${group}`;
}

// ---------- MAIN ----------

function plugin(file, librarySettings) {

  const response = {
    file,
    removeFromDB:false,
    updateDB:false,
    reQueueAfter:false,
    infoLog:""
  };

  try {

    const path = require("path");
    const fs = require("fs-extra");

    const oldPath = file._id;
    const cache = librarySettings.cache;

    if (!oldPath.startsWith(cache)) return response;

    const base = path.basename(oldPath);
    const ext = path.extname(base);
    const name = base.slice(0,-ext.length);

    const streams = getStreams(file);

    const newName = isTV(name)
      ? buildTV(name, streams)
      : buildMovie(name, streams);

    const newPath = path.join(path.dirname(oldPath), newName + ext);

    if (newPath !== oldPath) {
      fs.moveSync(oldPath, newPath);
      response.updateDB = true;
      response.file._id = newPath;
    }

  } catch (err) {
    response.infoLog += err.toString();
    throw err;
  }

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
module.exports.dependencies = ["fs-extra"];
