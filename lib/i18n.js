'use babel';

import { Emitter } from 'atom';
import chokidar from 'chokidar';
import { getTranslations } from './util';

export default class I18n {
  constructor() {
    this.emitter = new Emitter();
    this.translations = [];
  }

  destroy() {
    this.translations = null;
    this.stopWatch();
  }

  onWillLoad(callback) {
    return this.emitter.on('will-load', callback);
  }

  onDidLoad(callback) {
    return this.emitter.on('did-load', callback);
  }

  setLocalePaths(localePaths) {
    this.localePaths = localePaths;
    this.loadLocales();
    this.watch();
  }

  setTranslations(translations) {
    const translationsArray = Object.keys(translations).map(key => [key, translations[key]]);
    this.translations = new Map(translationsArray);
  }

  getTranslations() {
    return this.translations;
  }

  getTranslation(key) {
    return this.translations.get(key);
  }

  async loadLocales() {
    if (this.loading) return;
    this.loading = true;
    this.emitter.emit('will-load');
    const translations = await getTranslations(this.localePaths);
    this.setTranslations(translations);
    this.loading = false;
    this.emitter.emit('did-load');
  }

  watch() {
    this.stopWatch();
    this.watcher = chokidar.watch(this.localePaths);
    this.watcher.on('all', (event) => {
      if (['add', 'change', 'unlink'].includes(event)) {
        this.loadLocales(this.localePaths);
      }
    });
  }

  stopWatch() {
    if (!this.watcher) return;
    this.watcher.close();
    this.watcher = null;
  }
}
