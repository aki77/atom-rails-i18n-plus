'use babel';

import path from 'path';
import chokidar from 'chokidar';
import TranslateProvider from './translate-provider';
import TranslatePrefixProvider from './translate-prefix-provider';
import LocalizeProvider from './localize-provider';
import HyperclickProvider from './hyperclick-provider';
import { getTranslations } from './util';

class RailsI18nPlusPackage {
  constructor() {
    this.loading = false;
  }

  activate() {
    this.autocompleteProviders = [
      new TranslateProvider(),
      new TranslatePrefixProvider(),
      new LocalizeProvider(),
    ];
    this.hyperclickProvider = new HyperclickProvider();

    this.subscription = atom.config.observe('rails-i18n-plus.localesPaths', (values) => {
      const projectPath = atom.project.getPaths()[0];
      const localePaths = values.map(value => path.join(projectPath, value));
      this.loadLocales(localePaths);
      this.watch(localePaths);
    });
  }

  loadLocales(localesPaths) {
    if (this.loading) return;
    this.loading = true;
    getTranslations(localesPaths).then((translations) => {
      this.autocompleteProviders.forEach((provider) => {
        if (provider.setTranslations) provider.setTranslations(translations);
      });
      this.hyperclickProvider.setTranslations(translations);
      this.loading = false;
    });
  }

  watch(localesPaths) {
    this.stopWatch();
    this.watcher = chokidar.watch(localesPaths);
    this.watcher.on('all', (event) => {
      if (['add', 'change', 'unlink'].includes(event)) this.loadLocales(localesPaths);
    });
  }

  stopWatch() {
    if (!this.watcher) return;
    this.watcher.close();
    this.watcher = null;
  }

  deactivate() {
    delete this.autocompleteProviders;
    this.providers = null;

    this.stopWatch();

    if (this.subscription) this.subscription.dispose();
    this.subscription = null;
  }

  provideAutocomplete() {
    return this.autocompleteProviders;
  }

  provideHyperclick() {
    return this.hyperclickProvider;
  }
}

export default new RailsI18nPlusPackage();
