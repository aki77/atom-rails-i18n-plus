'use babel';

import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { flatten } from 'flat';

const readdir = Promise.promisify(fs.readdir);
const readFile = Promise.promisify(fs.readFile);

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

const escapeRegExp = string => string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

export default class LocalizeProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
    this.excludeLowerPriority = true;

    this.loadLocales();
  }

  loadLocales() {
    const getLocaleFiles = atom.config.get('autocomplete-rails-i18n.localesPaths').map(LocalizeProvider.getLocaleFiles);
    Promise.all(getLocaleFiles)
      .then(files => [].concat(...files))
      .then(files => Promise.all(files.map(file => readFile(file))))
      .then(buffers => buffers.map(buffer => yaml.safeLoad(buffer, { json: true })))
      .then((data) => {
        const keyValues = data.map((json) => {
          const localeData = Object.keys(json).map(key => json[key]);
          return flatten(Object.assign({}, ...localeData));
        });
        return Object.assign({}, ...keyValues);
      })
      .then((suggestions) => {
        this.suggestions = suggestions;
      });
  }

  getSuggestions({ editor, bufferPosition, prefix }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('autocomplete-rails-i18n.localizeMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(`[^a-z.](${methods.join('|')})['"\\s(]+.*format: :?[a-zA-Z0-9_]*$`);

    if (!lineRegexp.test(line)) {
      return [];
    }

    const formatPrefix = prefix.replace(':', '').trim();

    return new Promise((resolve) => {
      const suggestions = Object.keys(this.suggestions)
        .filter(key => key.startsWith('date.formats.') || key.startsWith('time.formats.'))
        .filter(key => formatPrefix.length === 0 || key.includes(formatPrefix))
        .map((key) => {
          const value = this.suggestions[key];
          const keys = key.split('.');
          return {
            text: `:${keys[2]}`,
            displayText: keys[2],
            type: 'keyword',
            rightLabel: value,
            leftLabel: keys[0],
            description: value,
          };
        });
      resolve(suggestions);
    });
  }

  static getLocaleFiles(dirname) {
    const projectPath = atom.project.getPaths()[0];
    return readdir(path.join(projectPath, dirname)).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return [];
    }).then(files => files.map(file => path.join(projectPath, dirname, file)));
  }
}
