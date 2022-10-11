const selectedFilePrefix = "Selected PDF file";

const credentials = {
  input: "Please input your token ID and token from your sipgate account.",
  errorTokenId:
    "Please check your token ID as it was entered in the wrong format.",
  errorToken: "Please check your token as it was entered in the wrong format.",
  save: "Save",
  authentication: "Authentification",
  tokenID: {
    title: "Your token ID",
    hint: "Example token ID: token-XXXXXX",
  },
  token: {
    title: "Your token",
    hint: "Example token: AAAABBBB-CCCC-DDDD-EEEE-FFFFGGGGHHHH",
  },
  changeTokenButton: "Change token ID and token",
};

const fax = {
  input:
    "Please select any PDF file you want to send as a fax from the left-hand side.",
  success: "Your fax was sent successfully.",
  selectFaxButton: "Change receiver faxline",
  selectFax: "Select the faxline via which the PDF file will be sent.",
  selectFaxHeader: "Choose fax",
  faxDropdownTitle: "Receiver faxline",
  errorPhoneNumber:
    "The phone number is not in the expected format. Please provide the phone number in the format +49XXXXXXXX",
  errorFaxline:
    "The faxline is not in the expected format. Please provide the faxline in the format fX",
  send: "Send fax",
  header: "Fax",
  phoneNumber: {
    title: "Receiving number",
    hint: "Example number: +49123456789",
  },
  faxline: {
    title: "Faxline",
    hint: "Example faxline: f1",
  },
};
