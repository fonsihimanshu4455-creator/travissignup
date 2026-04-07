const SHEET_NAME = "Signups";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_NOTIFY_WEBHOOK = "";

function doGet() {
  return jsonResponse_({ ok: true, message: "Signup endpoint is running." });
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    const data = JSON.parse(raw);

    const username = sanitize_(data.username);
    const mobileNumber = sanitize_(data.mobileNumber);
    const password = sanitize_(data.password);
    const website = sanitize_(data.website);
    const submittedAt = sanitize_(data.submittedAt) || new Date().toISOString();

    const sheet = getSheet_();
    sheet.appendRow([submittedAt, username, mobileNumber, password, website]);

    const subject = "New Signup Alert";
    const body =
      "Kisi ne sign up kiya hai.\n\n" +
      "Username: " + username + "\n" +
      "Mobile Number: " + mobileNumber + "\n" +
      "Website: " + website + "\n" +
      "Submitted At: " + submittedAt;
    MailApp.sendEmail(ADMIN_EMAIL, subject, body);

    if (ADMIN_NOTIFY_WEBHOOK) {
      UrlFetchApp.fetch(ADMIN_NOTIFY_WEBHOOK, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          text:
            "New signup received\n" +
            "Username: " + username + "\n" +
            "Mobile: " + mobileNumber + "\n" +
            "Website: " + website
        }),
        muteHttpExceptions: true
      });
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (sheet) {
    return sheet;
  }

  const created = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
  created.appendRow(["Submitted At", "Username", "Mobile Number", "Password", "Website"]);
  return created;
}

function sanitize_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
