module.exports = async (args) => {

/*
===========================================
PERSONAL_Radarr_Router v1.0.1
===========================================

Purpose:
- Route Tdarr processed movie files to the correct Radarr notify step
  based on the ORIGINAL library path.

Routing:
1 = radarr
    /moviesHD/shared/

2 = radarrLOCAL
    /moviesHD/local/

3 = radarr3D
    /movies3D/

Expected Flow Position:
- Run after final media processing
- Connect each output to the proper Radarr notify step

Behavior:
- If path matches none of the expected roots, THROW ERROR and fail flow
- This prevents notifying the wrong Radarr instance silently

Notes:
- Uses originalLibraryFile first so routing is based on the source library path,
  not cache path or post-processing working path.
===========================================
*/

  const originalPath =
    args.originalLibraryFile?._id ||
    args.inputFileObj?._id ||
    '';

  console.log(`PERSONAL_Radarr_Router: Checking original path -> ${originalPath}`);

  // Output 1 = Shared Movies
  if (originalPath.includes('/moviesHD/shared/')) {
    console.log('PERSONAL_Radarr_Router: Matched /moviesHD/shared/ -> Output 1 (radarr)');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Output 2 = Local Movies
  if (originalPath.includes('/moviesHD/local/')) {
    console.log('PERSONAL_Radarr_Router: Matched /moviesHD/local/ -> Output 2 (radarrLOCAL)');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  // Output 3 = 3D Movies
  if (originalPath.includes('/movies3D/')) {
    console.log('PERSONAL_Radarr_Router: Matched /movies3D/ -> Output 3 (radarr3D)');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 3,
      variables: args.variables,
    };
  }

  throw new Error(
    `PERSONAL_Radarr_Router: No Radarr route matched for original path: ${originalPath}`
  );
};
