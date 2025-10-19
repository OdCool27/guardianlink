const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSosSms = async (toPhoneNumber, userName, locationLink) => {
  await client.messages.create({
    body: `🚨 EMERGENCY ALERT from ${userName}!

Your contact has activated their SOS alert and may need immediate assistance.

View their live location: ${locationLink}

- GuardianLink`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toPhoneNumber
  });
};

const sendCompanionModeSms = async (toPhoneNumber, userName, locationLink, durationMinutes) => {
  await client.messages.create({
    body: `📍 ${userName} is sharing their live location with you for ${durationMinutes} minutes.

View location: ${locationLink}

- GuardianLink`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toPhoneNumber
  });
};

const sendSafeSms = async (toPhoneNumber, userName) => {
  await client.messages.create({
    body: `✅ ${userName} has marked themselves as safe. The emergency has been resolved.\n\n- GuardianLink`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toPhoneNumber
  });
};

const sendWhatsAppMessage = async (toPhoneNumber, userName, locationLink, isSos = false) => {
  const message = isSos
    ? `🚨 *EMERGENCY ALERT* from ${userName}!

Your contact has activated their SOS alert and may need immediate assistance.

View their live location: ${locationLink}`
    : `📍 ${userName} is sharing their live location with you.\n\nView location: ${locationLink}`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${toPhoneNumber}`
  });
};

module.exports = {
  sendSosSms,
  sendCompanionModeSms,
  sendSafeSms,
  sendWhatsAppMessage
};
