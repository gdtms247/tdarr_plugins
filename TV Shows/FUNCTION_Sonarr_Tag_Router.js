/*****************************************************************
 TDARR FLOW CUSTOM JS FUNCTION
 SONARR TAG ROUTER

 OUTPUT 1 = Optimized TV
 OUTPUT 2 = Standard TV
*****************************************************************/
module.exports = async (args) => {
  const jobLog = args.jobLog || console.log;

  const route = (outputNumber) => {
    return {
      outputFileObj: args.inputFileObj,
      outputNumber,
      variables: args.variables,
    };
  };

  try {
    const originalPath =
      args?.originalLibraryFile?._id ||
      args?.inputFileObj?._id ||
      '';

    jobLog(`Original Path: ${originalPath}`);

    let SONARR_URL = '';
    let SONARR_API = '';
    let libraryType = '';
    let rootMarker = '';

    if (
      originalPath.includes('/mnt/media/shows/shared/') ||
      originalPath.includes('/shows/shared/') ||
      originalPath.includes('/anime/shared/') ||
      originalPath.includes('/kids/shared/')
    ) {
      SONARR_URL = 'http://192.168.37.205';
      SONARR_API = '97f7fe8ed41f4f408bd79ea191389cf3';
      libraryType = 'shared';
      jobLog('Detected SHARED library.');
    } else if (
      originalPath.includes('/mnt/media/shows/local/') ||
      originalPath.includes('/shows/local/') ||
      originalPath.includes('/anime/local/') ||
      originalPath.includes('/kids/local/')
    ) {
      SONARR_URL = 'http://192.168.37.206';
      SONARR_API = '9e8e07bdd6df42ccb5b3524c600c12fd';
      libraryType = 'local';
      jobLog('Detected LOCAL library.');
    } else {
      jobLog('Could not determine library. Routing Standard.');
      return route(2);
    }

    const possibleMarkers = [
      `/mnt/media/shows/${libraryType}/`,
      `/shows/${libraryType}/`,
      `/anime/${libraryType}/`,
      `/kids/${libraryType}/`,
    ];

    rootMarker = possibleMarkers.find((marker) => originalPath.includes(marker)) || '';

    if (!rootMarker) {
      jobLog('Failed determining root marker. Routing Standard.');
      return route(2);
    }

    const afterRoot = originalPath.split(rootMarker)[1];

    if (!afterRoot) {
      jobLog('Failed parsing show folder. Routing Standard.');
      return route(2);
    }

    const showFolder = afterRoot.split('/')[0];

    if (!showFolder) {
      jobLog('Show folder empty. Routing Standard.');
      return route(2);
    }

    jobLog(`Detected Show Folder: ${showFolder}`);

    const seriesResponse = await fetch(`${SONARR_URL}/api/v3/series`, {
      headers: {
        'X-Api-Key': SONARR_API,
      },
    });

    if (!seriesResponse.ok) {
      throw new Error(`Series API failed with status ${seriesResponse.status}`);
    }

    const seriesList = await seriesResponse.json();

    const matchedSeries = seriesList.find((series) => {
      const folderName = String(series.path || '')
        .split('/')
        .pop()
        .toLowerCase();

      return folderName === showFolder.toLowerCase();
    });

    if (!matchedSeries) {
      jobLog('No Sonarr match found. Routing Standard.');
      return route(2);
    }

    jobLog(`Matched Series: ${matchedSeries.title}`);

    const tagResponse = await fetch(`${SONARR_URL}/api/v3/tag`, {
      headers: {
        'X-Api-Key': SONARR_API,
      },
    });

    if (!tagResponse.ok) {
      throw new Error(`Tag API failed with status ${tagResponse.status}`);
    }

    const tagList = await tagResponse.json();
    const tagLookup = {};

    for (const tag of tagList) {
      tagLookup[tag.id] = tag.label;
    }

    const seriesTags = (matchedSeries.tags || [])
      .map((id) => tagLookup[id])
      .filter(Boolean);

    jobLog(`Tags Found: ${JSON.stringify(seriesTags)}`);

    if (
      seriesTags.some((tag) => String(tag).toLowerCase() === 'optimized-tv')
    ) {
      jobLog('optimized-tv found -> Routing Optimized');
      return route(1);
    }

    jobLog('No optimized-tv tag -> Routing Standard');
    return route(2);
  } catch (err) {
    jobLog(`ERROR: ${err.message}`);
    jobLog('Routing Standard due to router failure.');
    return route(2);
  }
};
