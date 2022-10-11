// Triggers if there is no item selected. It is a standard function that is declared in the manifest.
function onDriveHomePageOpen(event) {
  return buildCard("DefaultCard", createDefaultSection());
}

// Triggers if an item is selected. It is a standard function that is declared in the manifest.
function onDriveItemsSelected(event) {
  const isConfigured =
    PropertiesService.getUserProperties().getKeys().includes("tokenID") &&
    PropertiesService.getUserProperties().getKeys().includes("token");

  if (event.drive.activeCursorItem.mimeType == "application/pdf") {
    PropertiesService.getUserProperties().setProperty(
      "filename",
      event.drive.activeCursorItem.title
    );

    return buildCard(
      "OnSelected",
      isConfigured ? createFaxSection(null) : createAuthSection()
    );
  }
  return buildCard("DefaultCard", createDefaultSection());
}

function sendFaxAction(e) {
  const faxlineID =
    PropertiesService.getUserProperties().getProperty("faxlineID");
  const phoneNumber = e.formInput.phoneNumber;
  const title = e.drive.activeCursorItem.title;

  if (!PHONENUMBER_E164_REGEX.test(phoneNumber)) {
    return buildCard("DefaultCard", createFaxSection(fax.errorPhoneNumber));
  }

  const pdfFile = DriveApp.getFileById(e.drive.activeCursorItem.id);
  const pdfBase64 = Utilities.base64Encode(pdfFile.getBlob().getBytes());

  try {
    sendFax(faxlineID, phoneNumber, title, pdfBase64);
  } catch (error) {
    return buildCard("DefaultCard", createFaxSection(error.message));
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(fax.success))
    .build();
}

function changeTokenAction(e) {
  return buildCard("OnSelected", createAuthSection());
}

function selectFaxButtonAction(e) {
  return buildCard("OnSelected", createSelectFaxSection());
}

function saveAuthDetailsAction(e) {
  const token = e.formInput.token;
  const tokenID = e.formInput.tokenID;
  const userProperties = PropertiesService.getUserProperties();

  if (!isValidTokenId(tokenID)) {
    return buildCard(
      "DefaultCard",
      createAuthSection(credentials.errorTokenId)
    );
  } else if (!isValidToken(token)) {
    return buildCard("DefaultCard", createAuthSection(credentials.errorToken));
  }

  userProperties.setProperty("tokenID", tokenID);
  userProperties.setProperty("token", token);

  return buildCard("DefaultCard", createFaxSection());
}

function saveSelectedFaxAction(e) {
  const availableFaxlines = JSON.parse(e.parameters.availableFaxlines);
  const selectedFaxlineID = e.formInput.selectedFax;

  const currentlySelectedFaxline = availableFaxlines.find(
    (faxline) => faxline.id === selectedFaxlineID
  );

  PropertiesService.getUserProperties().setProperty(
    "faxlineID",
    currentlySelectedFaxline.id
  );
  PropertiesService.getUserProperties().setProperty(
    "faxlineAlias",
    currentlySelectedFaxline.alias
  );

  return buildCard("DefaultCard", createFaxSection());
}

function createDefaultSection() {
  const paragraph = CardService.newTextParagraph().setText(fax.input);
  const defaultSection = CardService.newCardSection().addWidget(paragraph);

  return defaultSection;
}

function createFaxSection(errorMessage) {
  const userProps = PropertiesService.getUserProperties();
  const filename = userProps.getProperty("filename");

  const phoneNumberInput = CardService.newTextInput()
    .setFieldName("phoneNumber")
    .setHint(fax.phoneNumber.hint)
    .setTitle(fax.phoneNumber.title);

  if ((userProps.getProperty("faxlineAlias") ?? "") === "") {
    return createSelectFaxSection();
  }

  const faxlineIDInput = CardService.newDecoratedText()
    .setText(userProps.getProperty("faxlineAlias"))
    .setTopLabel(fax.faxline.title);

  const errorText = errorMessage
    ? CardService.newTextParagraph().setText(createErrorText(errorMessage))
    : null;

  const selectedFileText = CardService.newTextParagraph().setText(
    `${selectedFilePrefix} "${filename}"`
  );

  const changeTokenAction =
    CardService.newAction().setFunctionName("changeTokenAction");
  const changeTokenButton = CardService.newTextButton()
    .setText(credentials.changeTokenButton)
    .setOnClickAction(changeTokenAction);

  const sendFaxAction =
    CardService.newAction().setFunctionName("sendFaxAction");

  const sendFaxButton = CardService.newTextButton()
    .setText(fax.send)
    .setOnClickAction(sendFaxAction);

  const selectFaxButtonAction = CardService.newAction().setFunctionName(
    "selectFaxButtonAction"
  );

  const selectFaxButton = CardService.newTextButton()
    .setText(fax.selectFaxButton)
    .setOnClickAction(selectFaxButtonAction);

  const buttonSet = CardService.newButtonSet()
    .addButton(sendFaxButton)
    .addButton(changeTokenButton)
    .addButton(selectFaxButton);

  const detailSection = CardService.newCardSection()
    .setHeader(fax.header)
    .addWidget(faxlineIDInput)
    .addWidget(phoneNumberInput)
    .addWidget(selectedFileText);
  if (errorText) {
    detailSection.addWidget(errorText);
  }
  detailSection.addWidget(buttonSet);

  return detailSection;
}

function createAuthSection(errorMessage) {
  const paragraph = CardService.newTextParagraph().setText(credentials.input);

  const errorText = errorMessage
    ? CardService.newTextParagraph().setText(createErrorText(errorMessage))
    : null;

  const tokenID = CardService.newTextInput()
    .setFieldName("tokenID")
    .setHint(credentials.tokenID.hint)
    .setTitle(credentials.tokenID.title);

  const token = CardService.newTextInput()
    .setFieldName("token")
    .setHint(credentials.token.hint)
    .setTitle(credentials.token.title);

  const saveAction = CardService.newAction().setFunctionName(
    "saveAuthDetailsAction"
  );
  const saveButton = CardService.newTextButton()
    .setText(credentials.save)
    .setOnClickAction(saveAction);

  const authSection = CardService.newCardSection()
    .setHeader(credentials.authentication)
    .addWidget(paragraph)
    .addWidget(tokenID)
    .addWidget(token);
  if (errorText) {
    authSection.addWidget(errorText);
  }
  authSection.addWidget(saveButton);

  return authSection;
}

function createSelectFaxSection() {
  const availableFaxlines = getUsersFaxlines();

  const saveFaxAction = CardService.newAction()
    .setFunctionName("saveSelectedFaxAction")
    .setParameters({ availableFaxlines: JSON.stringify(availableFaxlines) });

  const saveFaxButton = CardService.newTextButton()
    .setText(credentials.save)
    .setOnClickAction(saveFaxAction);

  const faxDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName("selectedFax")
    .setTitle(fax.faxDropdownTitle);

  availableFaxlines.forEach(({ id, alias }) =>
    faxDropdown.addItem(
      alias,
      id,
      PropertiesService.getUserProperties().getProperty("faxlineID") === id
    )
  );

  const selectFaxSection = CardService.newCardSection()
    .setHeader(fax.selectFaxHeader)
    .addWidget(CardService.newTextParagraph().setText(fax.selectFax))
    .addWidget(faxDropdown)
    .addWidget(saveFaxButton);

  return selectFaxSection;
}
