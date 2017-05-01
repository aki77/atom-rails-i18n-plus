'use babel';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

const escapeRegExp = string => string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

export default class LocalizeProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.suggestionPriority = 5;

    this.translations = [];
  }

  setTranslations(translations) {
    this.translations = translations;
  }

  getSuggestions({ editor, bufferPosition }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('rails-i18n-plus.localizeMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(
      `[^a-z.](?:${methods.join('|')})['"\\s(]+.*format: (:?([a-zA-Z0-9_]*))$`,
    );

    const matches = line.match(lineRegexp);
    if (!matches) {
      return [];
    }
    const [, replacementPrefix, formatPrefix] = matches;

    return new Promise((resolve) => {
      const suggestions = Object.keys(this.translations)
        .filter(key => key.startsWith('date.formats.') || key.startsWith('time.formats.'))
        .filter(key => formatPrefix.length === 0 || key.includes(formatPrefix))
        .map((key) => {
          const value = this.translations[key];
          const keys = key.split('.');
          return {
            text: `:${keys[2]}`,
            displayText: keys[2],
            type: 'keyword',
            rightLabel: value,
            leftLabel: keys[0],
            description: value,
            replacementPrefix,
          };
        });
      resolve(suggestions);
    });
  }
}
