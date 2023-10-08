const Application = {
  crateMenu(): void {
    SpreadsheetApp.getUi()
      .createMenu('Parsing')
      .addItem('Parse rates', 'openParsingDialog')
      .addToUi();
  },

  openParsingDialog() {
    const userInterface = HtmlService.createTemplateFromFile(
      'gas/static/modal.html',
    ).evaluate();
    SpreadsheetApp.getUi().showModelessDialog(
      userInterface,
      'Get Select Range',
    );
  },
};

export default Application;
