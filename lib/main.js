'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';
import TranslateProvider from './translate-provider';
import TranslatePrefixProvider from './translate-prefix-provider';
import LocalizeProvider from './localize-provider';
import HyperclickProvider from './hyperclick-provider';
import I18n from './i18n';

export default {
  activate() {
    this.i18n = new I18n();
    this.autocompleteProviders = [
      new TranslateProvider(this.i18n),
      new TranslatePrefixProvider(),
      new LocalizeProvider(this.i18n),
    ];
    this.hyperclickProvider = new HyperclickProvider(this.i18n);

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('rails-i18n-plus.localesPaths', (values) => {
      const projectPath = atom.project.getPaths()[0];
      const localePaths = values.map(value => path.join(projectPath, value));
      requestIdleCallback(() => this.i18n.setLocalePaths(localePaths));
    }));
  },

  deactivate() {
    delete this.autocompleteProviders;
    this.providers = null;
    if (this.i18n) {
      this.i18n.destroy();
      this.i18n = null;
    }

    if (this.subscriptions) {
      this.subscriptions.dispose();
      this.subscriptions = null;
    }
  },

  provideAutocomplete() {
    return this.autocompleteProviders;
  },

  provideHyperclick() {
    return this.hyperclickProvider;
  },

  consumeSignal(registry) {
    const provider = registry.create();
    this.subscriptions.add(provider);

    this.subscriptions.add(this.i18n.onWillLoad(() => {
      provider.add('rails-i18n-plus loading');
    }));
    this.subscriptions.add(this.i18n.onDidLoad(() => {
      provider.clear();
    }));
  },
};
