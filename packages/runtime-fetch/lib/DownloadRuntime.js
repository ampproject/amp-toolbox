/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const cacheListProvider = require('@ampproject/toolbox-cache-list');
const nodeFetch = require('node-fetch');
const fse = require('fs-extra');
const https = require('https');
const log = require('@ampproject/toolbox-core').log.tag('Runtime Download');
const os = require('os');
const path = require('path');
const runtimeVersionProvider = require('@ampproject/toolbox-runtime-version');
const {URL} = require('url');

const RUNTIME_FILES_TXT = 'files.txt';
const fetchOptions = {
  agent: new https.Agent({
    keepAlive: true,
    maxSockets: 6,
  }),
  compress: true,
};

class DownloadRuntime {
  constructor(fetch, cacheList, runtimeVersion) {
    this.fetch_ = fetch || nodeFetch;
    this.cacheList_ = cacheList || cacheListProvider;
    this.runtimeVersion_ = runtimeVersion || runtimeVersionProvider;
  }

  /**
   * Download the AMP runtime.
   *
   * @param {Object} options - the options.
   * @param {string} options.dest - path to directory where AMP runtime should be saved.
   * @param {bool} options.clear - disable clearing destination directory before saving.
   * @param {string} options.rtv - the runtime version of the AMP runtime.
   * @param {string} options.ampUrlPrefix - absolute URL to the AMP runtime.
   * @return {Promise<Object>} a promise that resolves with data about the download.
   *
   * The return object includes the success or failure status, as well as data about the AMP
   * runtime that was downloaded:
   * {
   *   status {boolean} Overall AMP runtime download status
   *   error {string} Error message on failure
   *   count {number} Number of files in the AMP runtime
   *   url {string} URL to AMP runtime
   *   dest {string} Path to directory where AMP runtime was downloaded
   *   rtv {string} Runtime version of AMP runtime
   * }
   */
  async getRuntime(options = {}) {
    const {clear} = options;
    let {ampUrlPrefix, dest, rtv} = options;

    // Prepare response object
    const ret = {
      status: false,
      error: '',
      count: 0,
      url: '',
      dest: dest,
      rtv: '',
    };

    if (!dest) {
      ret.error = 'Directory not specified';
      log.error(ret.error);
      return ret;
    }

    // Expand ~ if it is the first path segment and non-Windows.
    // TODO: There's room for improvement in detecting which environments need this.
    if (os.type() != 'Windows_NT') {
      if (dest.split(path.sep)[0] === '~') {
        dest = dest.replace('~', os.homedir());
        ret.dest = dest;
      }
    }

    // Verify destination directory was specified and is writable
    try {
      this.assertDirectoryWritable_(dest);
    } catch (ex) {
      ret.error = ex.message;
      log.error(ret.error);
      return ret;
    }

    // Verify RTV is URL compatible if specified, otherwise fetch RTV from AMP
    // runtime cache (using ampUrlPrefix if specified).
    if (!rtv) {
      rtv = await this.runtimeVersion_.currentVersion({ampUrlPrefix});
      if (!rtv) {
        ret.error = 'Could not determine runtime version to download';
        log.error(ret.error);
        return ret;
      }
    } else if (rtv !== encodeURIComponent(rtv)) {
      ret.error = 'Invalid runtime version specified: ' + rtv;
      log.error(ret.error);
      return ret;
    }

    ret.rtv = rtv;
    log.info('RTV: ' + rtv);

    // Download runtime to rtv-specific path
    dest = path.join(dest, 'rtv', rtv);
    ret.dest = dest;
    fse.mkdirSync(dest, {recursive: true});

    // If AMP runtime cache was specified, verify it is an absolute URL.
    // Otherwise, assume Google's AMP runtime cache.
    if (!ampUrlPrefix) {
      const googleAmpCache = await this.cacheList_.get('google');
      if (!googleAmpCache) {
        ret.error = 'Could not determine AMP cache domain';
        log.error(ret.error);
        return ret;
      }
      ampUrlPrefix = 'https://' + googleAmpCache.cacheDomain;
    } else if (!this.isAbsoluteUrl_(ampUrlPrefix)) {
      ret.error = 'ampUrlPrefix must be an absolute URL';
      log.error(ret.error);
      return ret;
    }

    // Construct URLs to RTV-specific AMP runtime and files listing
    const runtimeBaseUrl = ampUrlPrefix + (ampUrlPrefix.endsWith('/') ? '' : '/') + `rtv/${rtv}/`;
    const filesTxtUrl = runtimeBaseUrl + RUNTIME_FILES_TXT;

    ret.url = runtimeBaseUrl;
    log.info('URL: ' + runtimeBaseUrl);

    // Fetch files listing and generate URLs to each file
    let files;
    try {
      const res = await this.fetch_(filesTxtUrl);
      if (!res.ok) {
        ret.error = 'Unable to fetch AMP runtime files listing: ' + filesTxtUrl;
        log.error(ret.error);
        return ret;
      }
      const text = await res.text();
      files = text
        .split(/\r?\n/)
        .filter((filepath) => filepath)
        .map((filepath) => {
          return {
            filepath: filepath.split('/').join(path.sep),
            url: runtimeBaseUrl + filepath,
          };
        });

      // Minimal sanity check that files listing includes itself
      if (!files.some((file) => file.filepath === 'v0.js')) {
        throw new Error(`Expected ${RUNTIME_FILES_TXT} in file listing, but it was not found.`);
      }
    } catch (ex) {
      ret.error = 'Unable to read AMP runtime files listing\n' + ex.message;
      log.error(ret.error);
      return ret;
    }

    ret.count = files.length;
    log.info(`File count: ${files.length}`);

    // Clear destination directory by default, but allow user to disable feature
    if (clear !== false) {
      await this.clearDirectory_(dest);
    }

    // Create all subdirectories in destination directory
    this.createSubdirectories_(files, dest);

    log.info('Downloading...');

    // Fetch all AMP runtime files and save them in the destination dir.
    // Note: fetchOptions sets maxSockets, limiting the number of concurrent
    // downloads, so this isn't as crazy as it might appear.
    const fetchAndSavePromises = files.map((file) => this.fetchAndSaveAsync_(file, dest));

    // Wait for all downloads to finish
    await Promise.all(fetchAndSavePromises)
      .then(() => {
        ret.status = true;
        log.info('Download complete: ' + dest);
      })
      .catch((error) => {
        ret.error = 'Failed to download\n' + error.message;
        log.error(ret.error);
      });

    return ret;
  }

  /* PRIVATE */

  /**
   * Verify path points to a writable directory. Attempt to create directory
   * if it does not yet exist. Throw on error.
   *
   * @param {string} dirpath - path to directory.
   */
  assertDirectoryWritable_(dirpath) {
    if (!fse.existsSync(dirpath) || !fse.lstatSync(dirpath).isDirectory()) {
      // Attempt to create directory
      log.info('Creating destination directory: ' + dirpath);
      fse.mkdirSync(dirpath, {recursive: true});
    }
    fse.accessSync(dirpath, fse.constants.R_OK | fse.constants.W_OK);
  }

  /**
   * Remove all contents from a directory.
   *
   * @param {string} dirpath - path to directory.
   */
  async clearDirectory_(dirpath) {
    log.info('Clearing destination directory');
    const contents = await fse.readdir(dirpath, {withFileTypes: true});
    const delPromises = contents.map(async (item) => {
      if (item.isDirectory()) {
        await fse.remove(path.join(dirpath, item.name));
      } else {
        await fse.unlink(path.join(dirpath, item.name));
      }
    });
    return Promise.all(delPromises);
  }

  /**
   * Determine whether a URL is absolute.
   *
   * @param {string} url - URL to test.
   * @return {bool}
   */
  isAbsoluteUrl_(url) {
    try {
      new URL(url);
      return true;
    } catch (ex) {
      return false;
    }
  }

  /**
   * Create any subdirectories needed for AMP runtime files.
   *
   * @param {Array} files - all files in AMP runtime.
   * @param {Object} files[n] - individual AMP runtime file data.
   * @param {string} files[n].filepath - relative path to AMP runtime file.
   * @param {string} files[n].url - absolute URL to AMP runtime file.
   * @param {string} dest - directory under which subdirectories should be created.
   */
  createSubdirectories_(files, dest) {
    // Identify relative directory for each file
    const dirs = files.map((file) => path.dirname(file.filepath));

    // Retain only unique relative directories
    const uniqueDirs = dirs.filter((dir, idx) => dir !== '.' && dirs.indexOf(dir) === idx);

    uniqueDirs.forEach((dir) => {
      // Convert path separators to match platform (maybe not necessary)
      dir = dir.split('/').join(path.sep);

      // Construct full path to directory in destination dir
      const fullpath = path.join(dest, dir);

      // Create new directories, recursively
      if (!fse.existsSync(fullpath)) {
        fse.mkdirSync(fullpath, {recursive: true});
      }
    });
  }

  /**
   * Fetch an AMP runtime file and save it to disk.
   *
   * @param {Object} file - individual AMP runtime file data.
   * @param {string} file.filepath - relative path to AMP runtime file.
   * @param {string} file.url - absolute URL to AMP runtime file.
   * @param {string} dest - directory under which subdirectories should be created.
   * @param {Promise}
   */
  async fetchAndSaveAsync_(file, dest) {
    const {filepath, url} = file;
    const fullpath = path.join(dest, filepath);

    // Fetch file
    const res = await this.fetch_(url, fetchOptions);
    if (!res.ok) {
      return Promise.reject(new Error('Failed to fetch ' + url));
    }

    // Prepare promise to indicate completion
    let resolve;
    let reject;
    const savePromise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // File fetched successfully, so open file stream
    const wstream = fse.createWriteStream(fullpath);

    // If this file is amp-geo.js, then undo the {{AMP_ISO_COUNTRY_HOTPATCH}}
    // hotpatch before saving. Otherwise, stream the file directly to disk.
    if (/amp-geo-([\d.]+|latest)\.m?js/.test(filepath)) {
      const text = (await res.text()).replace(
        / {28}|[a-z]{2} {26}|[a-z]{2} [a-z]{2}-[a-z0-9]{1,3} {19,21}/i,
        '{{AMP_ISO_COUNTRY_HOTPATCH}}'
      );
      wstream.write(text, wstream.close.bind(wstream));
    } else {
      res.body.pipe(wstream);
      res.body.on('error', reject);
    }

    wstream.on('finish', resolve);
    wstream.on('error', reject);

    return savePromise;
  }
}

module.exports = DownloadRuntime;
