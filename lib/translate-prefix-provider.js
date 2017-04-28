'use babel';

import path from 'path';

const SELECTOR = ['.source.ruby .string'];
const SELECTOR_DISABLE = ['* .comment'];

const escapeRegExp = string => string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

export default class TranslatePrefixProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
    this.excludeLowerPriority = true;
    this.suggestionPriority = 2;
  }

  getSuggestions({ editor, bufferPosition, prefix, activatedManually }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('autocomplete-rails-i18n.translateMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(`[^a-z.](${methods.join('|')})['"\\s(]+[a-zA-Z0-9.]*$`);

    if (!lineRegexp.test(line)) {
      return [];
    }

    const projectPath = atom.project.getPaths()[0];
    const keys = [];
    keys.push(...path.dirname(editor.getPath()).replace(`${projectPath}${path.sep}`, '').split(path.sep));
    keys.push(path.basename(editor.getPath()).split('.', 2)[0]);
    keys.shift();

    // NOTE: fix bracket-matcher
    if (prefix.length === 0 && !activatedManually) {
      setTimeout(() => {
        atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
      }, 10);
    }

    return [keys.join('.'), keys.slice(1).join('.')]
      .filter(suggestion => prefix.legnth === 0 || suggestion.startsWith(prefix))
      .map(suggestion => ({
        text: `${suggestion}.`,
        displayText: suggestion,
        type: 'keyword',
      }));
  }
}
