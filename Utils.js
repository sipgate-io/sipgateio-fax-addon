const TOKEN_ID_REGEX = /^token-\w{6}$/;
const TOKEN_REGEX = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/;

const FAXLINE_REGEX = /^f\d+$/;
const PHONENUMBER_E164_REGEX = /^\+[1-9]\d{1,14}$/;

function isValidTokenId(tokenID) {
  return TOKEN_ID_REGEX.test(tokenID);
}

function isValidToken(token) {
  return TOKEN_REGEX.test(token);
}

// does not escape input
function createErrorText(message) {
  return `<font color="#b31412">${message}</font>`;
}

function getBase64Token() {
  const userProperties = PropertiesService.getUserProperties();
  const base64Token = Utilities.base64Encode(
    Utilities.newBlob(
      `${userProperties.getProperty("tokenID")}:${userProperties.getProperty(
        "token"
      )}`
    ).getBytes()
  );
  return base64Token;
}

function buildCard(cardName, section) {
  return CardService.newCardBuilder()
    .setName(cardName)
    .addSection(section)
    .build();
}

function sendFax(faxline, phoneNumber, title, content) {
  const options = {
    method: "post",
    contentType: "application/json",
    payload: `{
      "faxlineId": "${faxline}",
      "recipient": "${phoneNumber}", 
      "filename": "${title}", 
      "base64Content": "${content}" 
    }`,
    headers: {
      Authorization: `Basic ${getBase64Token()}`,
    },
  };
  UrlFetchApp.fetch("https://api.sipgate.com/v2/sessions/fax", options);
}

function getCurrentWebuser() {
  // Get userinfo to obtain userID for current token
  const userInfoResponse = UrlFetchApp.fetch(
    "https://api.sipgate.com/v2/authorization/userinfo",
    {
      headers: {
        Authorization: `Basic ${getBase64Token()}`,
      },
    }
  );
  const userId = JSON.parse(userInfoResponse.getContentText()).sub;
  return userId;
}

function getUsersFaxlines() {
  const userId = getCurrentWebuser();

  // get faxdevices
  const faxlinesResponse = UrlFetchApp.fetch(
    `https://api.sipgate.com/v2/${userId}/faxlines`,
    {
      headers: {
        Authorization: `Basic ${getBase64Token()}`,
      },
    }
  );
  const faxlines = JSON.parse(faxlinesResponse.getContentText()).items;
  const viableFaxlines = faxlines.filter((faxline) => faxline.canSend);

  // discard everything but id, alias
  return viableFaxlines.map(({ id, alias }) => ({ id, alias }));
}
