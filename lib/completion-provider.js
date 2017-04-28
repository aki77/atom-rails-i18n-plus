'use babel';

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const flatten = require('flat');

const readdir = Promise.promisify(fs.readdir);
const readFile = Promise.promisify(fs.readFile);

const SELECTOR = ['.source.ruby .string'];
const SELECTOR_DISABLE = ['* .comment'];
const LINE_REGEXP = /[^a-z](t|[I18n.t])['"\s(]+[a-zA-Z0-9]+/;
const LOCALE = 'ja';

export default class CompletionProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
    this.excludeLowerPriority = true;
    this.filterSuggestions = true;

    this.loadLocales();
  }

  loadLocales() {
    const getLocaleFiles = atom.config.get('autocomplete-rails-i18n.localesPaths').map(CompletionProvider.getLocaleFiles);
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

  getSuggestions({ editor, bufferPosition }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (!LINE_REGEXP.test(line)) {
      return [];
    }

    return new Promise((resolve) => {
      const suggestions = Object.keys(this.suggestions).map((key) => {
        const value = this.suggestions[key];
        return {
          text: key,
          type: 'keyword',
          rightLabel: value,
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
