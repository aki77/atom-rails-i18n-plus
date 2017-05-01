'use babel';

const SELECTOR = ['.source.ruby .string'];
const SELECTOR_DISABLE = ['* .comment'];

const escapeRegExp = string => string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

export default class TranslateBaseProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
  }

  getSuggestions({ editor, bufferPosition, prefix, activatedManually }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('rails-i18n-plus.translateMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(`[^a-z.](${methods.join('|')})['"\\s(]+[a-zA-Z0-9.]*$`);

    if (!lineRegexp.test(line)) {
      return [];
    }

    // NOTE: fix bracket-matcher
    if (prefix.length === 0 && !activatedManually) {
      setTimeout(() => {
        atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
      }, 10);
    }

    return this.getTranslateSuggestions({ editor, prefix });
  }
}
