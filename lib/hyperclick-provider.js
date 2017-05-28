'use babel';

const SCOPE_NAMES = ['source.ruby', 'source.ruby.rails', 'text.haml', 'text.html.ruby'];
const SELECTORS = ['.string'];

export default class HyperclickProvider {
  constructor(i18n) {
    this.i18n = i18n;
    this.priority = 2;
    this.wordRegExp = /([\w.]+)/g;
  }

  getSuggestionForWord(editor, text, range) {
    const { scopeName } = editor.getGrammar();
    if (!SCOPE_NAMES.includes(scopeName)) {
      return null;
    }

    const scopeDescriptor = editor.scopeDescriptorForBufferPosition(range.start);
    const scopeChain = scopeDescriptor.getScopeChain();
    const found = SELECTORS.some(selector => scopeChain.includes(selector));
    if (!found) return null;

    const translationText = this.i18n.getTranslation(text);
    if (!translationText) return null;

    return {
      range,
      callback: () => {
        atom.notifications.addInfo(`${text}\n\n${translationText}`, { dismissable: true });
      },
    };
  }
}
