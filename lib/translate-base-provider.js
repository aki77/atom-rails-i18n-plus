'use babel';

import { escapeRegExp } from './util';

const SELECTOR = ['.source.ruby .string'];
const SELECTOR_DISABLE = ['* .comment'];

export default class TranslateBaseProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
  }

  getSuggestions({ editor, bufferPosition, activatedManually }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('rails-i18n-plus.translateMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(`[^a-z.](?:${methods.join('|')})['"\\s(]+([a-zA-Z0-9_.]*)$`);

    const matches = line.match(lineRegexp);
    if (!matches) {
      return [];
    }
    const [, replacementPrefix] = matches;

    // NOTE: fix bracket-matcher
    if (replacementPrefix.length === 0 && !activatedManually) {
      setTimeout(() => {
        atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
      }, 10);
    }

    return this.getTranslateSuggestions({ editor, replacementPrefix });
  }
}
