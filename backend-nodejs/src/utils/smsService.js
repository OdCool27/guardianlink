const twilio = require('twilio');

// Initialize Twilio client only if valid credentials are provided
let client = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.warn('⚠️  Twilio initialization failed:', error.message);
  }
} else {
  console.warn('⚠️  Twilio credentials not configured - SMS features disabled');
}

const sendSosSms = async (toPhoneNumber, userName, locationLink) => {
  if (!client) {
    console.warn('⚠️  SMS service not available - Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    await client.messages.create({
      body: `🚨 EMERGENCY ALERT from ${userName}!

Your contact has activated their SOS alert and may need immediate assistance.

View their live location: ${locationLink}

- GuardianLink`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhoneNumber
    });
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendCompanionModeSms = async (toPhoneNumber, userName, locationLink, durationMinutes) => {
  if (!client) {
    console.warn('⚠️  SMS service not available - Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    await client.messages.create({
      body: `📍 ${userName} is sharing their live location with you for ${durationMinutes} minutes.

View location: ${locationLink}

- GuardianLink`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhoneNumber
    });
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendSafeSms = async (toPhoneNumber, userName) => {
  if (!client) {
    console.warn('⚠️  SMS service not available - Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    await client.messages.create({
      body: `✅ ${userName} has marked themselves as safe. The emergency has been resolved.\n\n- GuardianLink`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhoneNumber
    });
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendWhatsAppMessage = async (toPhoneNumber, userName, locationLink, isSos = false) => {
  if (!client) {
    console.warn('⚠️  WhatsApp service not available - Twilio not configured');
    return { success: false, error: 'WhatsApp service not configured' };
  }
  
  try {
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
    return { success: true };
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSosSms,
  sendCompanionModeSms,
  sendSafeSms,
  sendWhatsAppMessage
};
