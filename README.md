# sipgate.io Fax Add-on

The following add-on for Google Drive uses our [sipgate Rest-API](https://www.sipgate.io/en/rest-api) to send a PDF file located in [Google Drive](https://drive.google.com/) as a fax. The add-on is powered by [Google Apps Script](https://developers.google.com/apps-script).

For further information regarding the sipgate Rest-API please visit our documentation at https://api.sipgate.com/v2/doc

- sipgate.io Fax Add-on
  - [Introduction](#introduction)
  - [Prerequisites](#prerequisites)
  - [Configuration](#configuration)
  - [How to use](#how-to-use)
    - [Selecting a PDF file](#selecting-a-pdf-file)
    - [Configuring the add-on](#configuring-the-add-on)
  - [How it works](#how-it-works)
  - [Contact us](#contact-us)
  - [External libraries](#external-libraries)

## Introduction

With this add-on, you can send any uploaded PDF file, which is located in your personal Google Drive storage, as fax via sipgate.io to any receiver.

## Prerequisites

Install [clasp](https://github.com/google/clasp) by `npm install -g clasp`

This enables you to develop Google Apps Script projects locally.

Initially, you will need to log in using `clasp login` to authenticate your Google account.

Afterwards, you will be able to create a new Google Apps Scripts project using `clasp create --title "sipgate.io Fax Add-on"`.

Navigate to [script.google.com](https://script.google.com/home), to discover your newly created project.

By running `clasp push` you can push your locally written code to the online editor of Google Apps Script.

## Configuration

In order to show your add-on inside your Google Drive, you have to deploy the Google Apps Script project from the online editor. Just navigate to `Deploy` in the upper right corner and click `Test deployments`. Now you can install your Google Workspace add-on by clicking the `Install` button.

From now on you should be able to see an icon with the sipgate.io logo located in the right sidebar in Google Drive.

## How To Use

### Selecting a PDF file

In order to send a fax, you first have to select a `PDF` file in Google Drive.

### Configuring the add-on

Launch the add-on by clicking on the sipgate.io logo located in the right sidebar. If a `PDF` file was selected in the previous step, you will prompted to input your API token. The token should have the `sessions:fax:write` scope in order to send a fax via our REST-API. If you have more than one faxline, you can chose the desired faxline in the next step. Finally, you have to provide a receiving number for the fax. A click on `Send fax` will send the fax.

## How it works

The add-on is powered by Google Apps Script. Please see their documentation for general instructions on [how to create a Google workspace add-on](https://developers.google.com/apps-script/add-ons/how-tos/building-workspace-addons). The following sections reveal the implementation details of our sipgate.io fax application.

As the user selects a PDF file, the `onDriveItemsSelected` function is invoked. This function checks, if any API token was set before. In this case, the user can input a fax receiving number. Otherwise the user will be prompted to input his token ID and token.

```js
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
```

If the add-on was configured successfully and the user presses the `Send fax` button, the `sendFaxAction` method will be called. Inside this function, a request will be send to our Rest-API in order to transmit the chosen PDF file as fax. The API call is made in the `sendFax` util function.

```js
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
```

## Contact us

Please let us know how we can improve this example. If you have a specific feature request or found a bug, please use Issues or fork this repository and send a **pull request** with your improvements.

## External libraries

- clasp:
  - Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
  - Website: https://github.com/google/clasp

[sipgate.io](https://www.sipgate.io) | [@sipgateio](https://twitter.com/sipgateio) | [API-doc](https://api.sipgate.com/v2/doc)
